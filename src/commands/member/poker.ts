import { BOT_EMOJI } from "../../config";
import { getActiveSocket } from "../../utils/activeSocket";
import { DangerError, InvalidParameterError, WarningError } from "../../errors";
import { cardImageUrl, drawCards } from "../../utils/deckOfCards";
import { formatPrice } from "../../utils/menuManager";
import { TURN_TIME_MS, startClock, stopClock } from "../../utils/pokerClock";
import { formatCards } from "../../utils/pokerHand";
import {
    DEFAULT_MINIMUM,
    MIN_PLAYERS,
    PokerAction,
    PokerEvent,
    PokerTable,
    addPlayer,
    applyAction,
    cardsNeeded,
    createTable,
    currentPlayer,
    deleteTable,
    finishTable,
    getAllTables,
    getOptions,
    getTable,
    leaveTable,
    maxBuyIn,
    minBuyIn,
    parseAmount,
    playersWithChips,
    potTotal,
    saveTable,
    startHand,
    timeBankLeft,
    useTimeBank,
    withTableLock,
} from "../../utils/pokerManager";

const POKER = ".poker";

const HELP = [
    "🃏 *Poker (Texas Hold'em)*",
    "",
    "*Mesa*",
    `${POKER} abrir [mínimo] → abre uma mesa (o mínimo é o big blind; padrão ${formatPrice(DEFAULT_MINIMUM)})`,
    `${POKER} entrar <nome> <buy-in> → entra na mesa (nome sem espaços; buy-in de 10 a 200 vezes o mínimo)`,
    `${POKER} iniciar → distribui as cartas e começa a mão`,
    `${POKER} saldo → mostra as suas fichas e o seu saldo na mesa`,
    `${POKER} sair → sai da mesa sem encerrá-la (se estiver numa mão, é fold)`,
    `${POKER} acabar → encerra a mesa e mostra o resumo`,
    `${POKER} ajuda → mostra esta ajuda`,
    "",
    "*Na sua vez*",
    `${POKER} check → passar a vez sem apostar (só quando não há aposta para pagar)`,
    `${POKER} call → pagar a aposta atual`,
    `${POKER} raise [valor] → aumentar a aposta para [valor] (sem valor: o dobro da aposta atual)`,
    `${POKER} fold → desistir da mão`,
    `${POKER} allin → apostar todas as suas fichas`,
    "",
    "*Regras*",
    "• A ordem de entrada define os lugares: na 1ª mão o 1º a entrar é o botão, o 2º o small blind e o 3º o big blind; depois gira no sentido horário.",
    "• As suas cartas chegam no seu privado.",
    `• Cada jogada tem ${TURN_TIME_MS / 1000} segundos. Quando o tempo acaba, o bot usa uma das suas 3 extensões de time bank (+${TURN_TIME_MS / 1000}s cada, valem para a mesa toda); sem extensões, é fold automático.`,
    "• Valores em reais: 0.10, 0,10 ou 50.",
    `• A mesa acaba quando só um jogador tiver fichas ou com ${POKER} acabar.`,
].join("\n");

const ACTIONS: PokerAction[] = ["check", "call", "raise", "fold", "allin"];

const STREET_NAMES = { flop: "Flop", turn: "Turn", river: "River" };

const mention = (jid: string) => `@${jid.split("@")[0]}`;

const signedPrice = (cents: number) => (cents < 0 ? `-${formatPrice(-cents)}` : `+${formatPrice(cents)}`);

const result = ({ buyIn, chips }: { buyIn: number; chips: number }) =>
    `buy-in ${formatPrice(buyIn)} → ${formatPrice(chips)} (${signedPrice(chips - buyIn)})`;

const sendGroup = async (socket: any, chatId: string, text: string, mentions: string[] = []) => {
    await socket.sendMessage(chatId, { text: `${BOT_EMOJI} ${text}`, mentions });
};

const requireTable = (chatId: string): PokerTable => {
    const table = getTable(chatId);
    if (!table) {
        throw new WarningError(`Não há mesa aberta neste grupo. Use ${POKER} abrir.`);
    }
    return table;
};

// The sender may come as a phone number JID or as a LID; group metadata can list either form
const isGroupAdmin = async (socket: any, chatId: string, userJid: string) => {
    const { participants, owner, ownerJid } = await socket.groupMetadata(chatId);
    const participant = participants.find((participant) =>
        [participant.id, participant.lid, participant.jid].includes(userJid)
    );
    return [owner, ownerJid].includes(userJid) || participant?.admin === "admin" || participant?.admin === "superadmin";
};

const requireManager = async (socket: any, table: PokerTable, userJid: string, action: string) => {
    const seated = table.players.some((player) => player.jid === userJid && !player.left);
    if (!seated && !(await isGroupAdmin(socket, table.chatId, userJid))) {
        throw new WarningError(`Só quem está na mesa ou um admin do grupo pode ${action}.`);
    }
};

// Card images first, then the text; a failed image falls back to the text alone
const sendCards = async (socket: any, table: PokerTable, jid: string, cards: string[]) => {
    for (const code of cards) {
        try {
            await socket.sendMessage(jid, { image: { url: cardImageUrl(code) } });
        } catch (error) {
            console.error("Erro ao enviar imagem da carta:", error);
        }
    }

    try {
        await socket.sendMessage(jid, { text: `${BOT_EMOJI} 🃏 Suas cartas na mão ${table.handNumber}: ${formatCards(cards)}` });
        return true;
    } catch (error) {
        console.error("Erro ao enviar cartas no privado:", error);
        return false;
    }
};

const describeEvents = (table: PokerTable, events: PokerEvent[]) => {
    const nameOf = (jid: string) => table.players.find((player) => player.jid === jid)!.name;
    const lines: string[] = [];
    const mentions: string[] = [];
    const tag = (jid: string) => {
        mentions.push(jid);
        return mention(jid);
    };

    for (const event of events) {
        switch (event.type) {
            case "blinds":
                lines.push(table.handNumber === 1 ? "Mesa iniciada!" : `Mão ${table.handNumber} iniciada!`);
                lines.push(
                    `Small blind: ${nameOf(event.smallBlind)} (${formatPrice(table.smallBlind)}) · Big blind: ${nameOf(event.bigBlind)} (${formatPrice(table.minimum)})`
                );
                break;
            case "action": {
                const name = nameOf(event.jid);
                const descriptions = {
                    check: `✔️ ${name} deu check.`,
                    call: `📞 ${name} deu call (${formatPrice(event.total)} na rodada).`,
                    raise: `⬆️ ${name} aumentou para ${formatPrice(event.total)}.`,
                    allin: `🔥 ${name} foi all-in (${formatPrice(event.total)} na rodada).`,
                    fold: `🏳️ ${name} desistiu da mão.`,
                };
                lines.push(descriptions[event.action]);
                break;
            }
            case "street":
                lines.push("", `🃏 *${STREET_NAMES[event.street]}:* ${formatCards(event.board)}`);
                break;
            case "foldWin":
                lines.push("", `🏆 ${tag(event.jid)} levou o pote de ${formatPrice(event.amount)}.`);
                break;
            case "showdown":
                lines.push("", "*Showdown!*");
                event.hands.forEach((hand) => lines.push(`${nameOf(hand.jid)}: ${formatCards(hand.cards)} → ${hand.handName}`));
                event.pots.forEach((pot, index) => {
                    const label = event.pots.length === 1 ? "o pote" : index === 0 ? "o pote principal" : `o pote paralelo ${index}`;
                    const winners = pot.winners.map(tag).join(" e ");
                    lines.push(
                        pot.winners.length === 1
                            ? `🏆 ${winners} levou ${label} de ${formatPrice(pot.amount)}.`
                            : `🤝 ${winners} dividiram ${label} de ${formatPrice(pot.amount)}.`
                    );
                });
                break;
            case "turn": {
                const first = events[0].type === "blinds";
                lines.push(
                    "",
                    first ? `${tag(event.jid)} começa!` : `${tag(event.jid)}, é sua vez!`,
                    ...getOptions(table).map((option) => `${POKER} ${option}`),
                    "",
                    `⏱️ ${TURN_TIME_MS / 1000}s para jogar · time bank: ${timeBankLeft(currentPlayer(table)!)} × ${TURN_TIME_MS / 1000}s`,
                    `Pote: ${formatPrice(potTotal(table))}`
                );
                break;
            }
        }
    }

    if (!table.hand) {
        const seated = table.players.filter((player) => !player.left);
        lines.push("", "Fichas: " + seated.map((player) => `${player.name} ${formatPrice(player.chips)}`).join(" · "));
    }

    return { text: lines.join("\n").trim(), mentions };
};

const announce = async (socket: any, table: PokerTable, events: PokerEvent[], header?: string) => {
    const { text, mentions } = describeEvents(table, events);
    await sendGroup(socket, table.chatId, header ? `${header}\n${text}` : text, mentions);

    // The clock starts over every time the turn changes and stops when the hand ends
    if (events.some((event) => event.type === "turn")) {
        startTurnClock(table.chatId);
    } else if (!table.hand) {
        stopTurnClock(table.chatId);
    }
};

// Each turn gets an id: a timer that fired for a turn already played (queued behind the lock) is ignored
const turnIds = new Map<string, number>();
let lastTurnId = 0;

const stopTurnClock = (chatId: string) => {
    turnIds.delete(chatId);
    stopClock(chatId);
};

const isCurrentTurn = (chatId: string, turnId: number) => turnIds.get(chatId) === turnId;

const runClock = (chatId: string, turnId: number) =>
    startClock(chatId, {
        onWarning: () => withTableLock(chatId, () => warnTurn(chatId, turnId)),
        onExpire: () => withTableLock(chatId, () => expireTurn(chatId, turnId)),
    });

const startTurnClock = (chatId: string) => {
    lastTurnId += 1;
    turnIds.set(chatId, lastTurnId);
    runClock(chatId, lastTurnId);
};

const warnTurn = async (chatId: string, turnId: number) => {
    const table = getTable(chatId);
    if (!isCurrentTurn(chatId, turnId) || !table?.hand) return;

    const { jid } = currentPlayer(table)!;
    await sendGroup(getActiveSocket(), chatId, `⏱️ ${mention(jid)}, faltam 10 segundos para você jogar!`, [jid]);
};

// Out of time: spend a time bank extension, or fold when there is none left (even if a check was possible)
const expireTurn = async (chatId: string, turnId: number) => {
    const table = getTable(chatId);
    if (!isCurrentTurn(chatId, turnId) || !table?.hand) return;

    const socket = getActiveSocket();
    const player = currentPlayer(table)!;
    const left = useTimeBank(table, player.jid);

    if (left !== null) {
        saveTable(table);
        runClock(chatId, turnId);
        await sendGroup(
            socket,
            chatId,
            `⏳ ${mention(player.jid)}, seu tempo acabou: usei 1 time bank (+${TURN_TIME_MS / 1000}s). Restam ${left}.`,
            [player.jid]
        );
        return;
    }

    const events = applyAction(table, player.jid, "fold");
    saveTable(table);
    await announce(socket, table, events, `⌛ Tempo esgotado: ${player.name} não jogou a tempo.`);

    if (!table.hand) {
        try {
            await afterHand(socket, table);
        } catch (error) {
            await sendGroup(socket, chatId, `❌ ${error.message}`);
        }
    }
};


const finish = async (socket: any, table: PokerTable, reason: string) => {
    stopTurnClock(table.chatId);
    const voided = Boolean(table.hand);
    const summary = finishTable(table);
    deleteTable(table.chatId);

    const lines = [
        "🏁 *Mesa encerrada!*",
        reason,
        ...(voided ? ["A mão em andamento foi anulada e as apostas voltaram para cada jogador."] : []),
        "",
        ...summary.map((player) => `${player.left ? `${player.name} (saiu)` : player.name}: ${result(player)}`),
    ];

    await sendGroup(socket, table.chatId, lines.join("\n"));
};

// Ends the table when only one player has chips, otherwise deals the next hand
const afterHand = async (socket: any, table: PokerTable) => {
    const remaining = playersWithChips(table);
    if (remaining.length < MIN_PLAYERS) {
        await finish(socket, table, `🏆 ${remaining[0].name} ficou com todas as fichas!`);
        return;
    }

    await dealHand(socket, table);
};

const dealHand = async (socket: any, table: PokerTable) => {
    await sendGroup(socket, table.chatId, "🃏 Distribuindo cartas...");

    let cards: string[];
    try {
        cards = await drawCards(cardsNeeded(table));
    } catch (error) {
        throw new DangerError(`${error.message} Use ${POKER} iniciar para tentar de novo.`);
    }

    const events = startHand(table, cards);
    saveTable(table);

    const dealt = table.players.filter((player) => player.cards.length);
    for (const player of dealt) {
        if (!(await sendCards(socket, table, player.jid, player.cards))) {
            await sendGroup(
                socket,
                table.chatId,
                `⚠️ Não consegui mandar as cartas no privado de ${mention(player.jid)}.`,
                [player.jid]
            );
        }
    }

    await announce(socket, table, events);

    // Blinds can put everyone all-in and finish the hand right away
    if (!table.hand) {
        await afterHand(socket, table);
    }
};

const open = async ({ remoteJid, sendReply }: CommonFunctions, args: string[]) => {
    if (getTable(remoteJid)) {
        throw new WarningError(`Já existe uma mesa aberta neste grupo. Use ${POKER} acabar para encerrá-la.`);
    }

    const table = createTable(remoteJid, args[0] ? parseAmount(args[0]) : DEFAULT_MINIMUM);
    saveTable(table);

    await sendReply(
        [
            "🃏 *Mesa de poker aberta!*",
            `Blinds: small ${formatPrice(table.smallBlind)} · big ${formatPrice(table.minimum)}`,
            `Buy-in: de ${formatPrice(minBuyIn(table))} a ${formatPrice(maxBuyIn(table))}`,
            "",
            `Para entrar: ${POKER} entrar <nome> <buy-in>`,
            `Para começar: ${POKER} iniciar (mínimo ${MIN_PLAYERS} jogadores)`,
        ].join("\n")
    );
};

const join = async ({ remoteJid, userJid, sendReply }: CommonFunctions, args: string[]) => {
    const table = requireTable(remoteJid);

    if (args.length !== 2) {
        throw new InvalidParameterError(`use ${POKER} entrar <nome> <buy-in>, ex.: ${POKER} entrar Pedro 50`);
    }

    const [name, buyIn] = args;
    const player = addPlayer(table, userJid, name, parseAmount(buyIn));
    saveTable(table);

    await sendReply(
        [
            `✅ ${player.name} entrou na mesa com ${formatPrice(player.buyIn)}.`,
            "",
            "*Jogadores:*",
            ...table.players.map((seated, index) => `${index + 1}. ${seated.name} (${formatPrice(seated.buyIn)})`),
        ].join("\n")
    );
};

// Chips already in the pot are not lost until the hand ends, so they count in the balance
const balance = async ({ remoteJid, userJid, sendReply }: CommonFunctions) => {
    const table = requireTable(remoteJid);
    const player = table.players.find((seated) => seated.jid === userJid);
    if (!player) {
        throw new WarningError("Você não está na mesa.");
    }

    await sendReply(
        [
            `💰 *Saldo de ${player.name}*`,
            `Fichas: ${formatPrice(player.chips)}`,
            ...(player.committed > 0 ? [`No pote nesta mão: ${formatPrice(player.committed)}`] : []),
            `Buy-in: ${formatPrice(player.buyIn)}`,
            `Saldo: ${signedPrice(player.chips + player.committed - player.buyIn)}`,
        ].join("\n")
    );
};

const start = async ({ socket, remoteJid, userJid }: CommonFunctions) => {
    const table = requireTable(remoteJid);
    await requireManager(socket, table, userJid, "iniciar a mesa");

    if (table.hand) {
        throw new WarningError("Já tem uma mão em andamento.");
    }

    if (playersWithChips(table).length < MIN_PLAYERS) {
        throw new WarningError(`São necessários pelo menos ${MIN_PLAYERS} jogadores para iniciar.`);
    }

    await dealHand(socket, table);
};

const play = async ({ socket, remoteJid, userJid }: CommonFunctions, action: PokerAction, args: string[]) => {
    const table = requireTable(remoteJid);
    const amount = action === "raise" && args[0] ? parseAmount(args[0]) : undefined;

    const events = applyAction(table, userJid, action, amount);
    saveTable(table);
    await announce(socket, table, events);

    if (!table.hand) {
        await afterHand(socket, table);
    }
};

// The bets already made stay in the pot; the player's result is announced right away
const leave = async ({ socket, remoteJid, userJid, sendReply }: CommonFunctions) => {
    const table = requireTable(remoteJid);
    const started = table.started;
    const events = leaveTable(table, userJid);
    saveTable(table);

    if (!started) {
        const seats = table.players.length
            ? table.players.map((seated, index) => `${index + 1}. ${seated.name}`)
            : ["Ninguém sentado."];
        await sendReply(["🚪 Você saiu da mesa.", "", "*Jogadores:*", ...seats].join("\n"));
        return;
    }

    const player = table.players.find((seated) => seated.jid === userJid)!;
    const exit = `🚪 ${player.name} saiu da mesa: ${result(player)}`;
    if (events.length) {
        await announce(socket, table, events, exit);
    } else {
        await sendGroup(socket, remoteJid, exit);
    }

    if (table.hand) return;

    if (events.some((event) => event.type === "foldWin")) {
        await afterHand(socket, table);
    } else if (playersWithChips(table).length < MIN_PLAYERS) {
        await finish(socket, table, "Não há jogadores suficientes para continuar.");
    }
};

const end = async ({ socket, remoteJid, userJid }: CommonFunctions) => {
    const table = requireTable(remoteJid);
    await requireManager(socket, table, userJid, "encerrar a mesa");

    const player = table.players.find((seated) => seated.jid === userJid);
    await finish(socket, table, `Encerrada por ${player ? player.name : "um admin"}.`);
};

export const poker: Command = {
    name: "Poker",
    description: "Joga uma mesa de Texas Hold'em no grupo, com as cartas no privado",
    commands: ["poker"],
    usage: [
        `${POKER} <subcomando> — use ${POKER} ajuda para ver todos`,
        `${POKER} abrir [mínimo]`,
        `${POKER} entrar <nome> <buy-in>`,
        `${POKER} iniciar`,
        `${POKER} check | call | raise [valor] | fold | allin`,
        `${POKER} saldo`,
        `${POKER} sair`,
        `${POKER} acabar`,
    ].join("\n"),
    handle: async (params) => {
        const [subcommand = "", ...args] = (params.fullArgs ?? "").trim().split(/\s+/).filter(Boolean);
        const action = subcommand.toLowerCase();

        if (!action || action === "ajuda") {
            await params.sendReply(HELP);
            return;
        }

        if (!params.isGroup) {
            throw new WarningError("O poker só funciona em grupos.");
        }

        await withTableLock(params.remoteJid, async () => {
            if (action === "abrir") return open(params, args);
            if (action === "entrar") return join(params, args);
            if (action === "iniciar") return start(params);
            if (action === "acabar") return end(params);
            if (action === "saldo") return balance(params);
            if (action === "sair") return leave(params);
            if (ACTIONS.includes(action as PokerAction)) return play(params, action as PokerAction, args);

            throw new WarningError(`Subcomando "${subcommand}" não existe. Use ${POKER} ajuda.`);
        });
    },
};

// Must stay declared after `poker`: the command loader takes the first export of each command file
// After a restart the player to act gets a full turn again
export const resumePokerClocks = () => {
    getAllTables()
        .filter((table) => table.hand)
        .forEach((table) => startTurnClock(table.chatId));
};
