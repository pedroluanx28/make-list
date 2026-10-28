import { BOT_EMOJI } from "../../config";
import { DangerError, InvalidParameterError, WarningError } from "../../errors";
import { cardImageUrl, drawCards } from "../../utils/deckOfCards";
import { formatPrice } from "../../utils/menuManager";
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
    deleteTable,
    finishTable,
    getOptions,
    getTable,
    parseAmount,
    playersWithChips,
    potTotal,
    saveTable,
    startHand,
    withTableLock,
} from "../../utils/pokerManager";

const POKER = ".poker";

const HELP = [
    "🃏 *Poker (Texas Hold'em)*",
    "",
    "*Mesa*",
    `${POKER} abrir [mínimo] → abre uma mesa (o mínimo é o big blind; padrão ${formatPrice(DEFAULT_MINIMUM)})`,
    `${POKER} entrar <nome> <buy-in> → entra na mesa (nome sem espaços)`,
    `${POKER} iniciar → distribui as cartas e começa a mão`,
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
    "• Valores em reais: 0.10, 0,10 ou 50.",
    `• A mesa acaba quando só um jogador tiver fichas ou com ${POKER} acabar.`,
].join("\n");

const ACTIONS: PokerAction[] = ["check", "call", "raise", "fold", "allin"];

const STREET_NAMES = { flop: "Flop", turn: "Turn", river: "River" };

const mention = (jid: string) => `@${jid.split("@")[0]}`;

const signedPrice = (cents: number) => (cents < 0 ? `-${formatPrice(-cents)}` : `+${formatPrice(cents)}`);

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
    const seated = table.players.some((player) => player.jid === userJid);
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
                    `Pote: ${formatPrice(potTotal(table))}`
                );
                break;
            }
        }
    }

    if (!table.hand) {
        lines.push("", "Fichas: " + table.players.map((player) => `${player.name} ${formatPrice(player.chips)}`).join(" · "));
    }

    return { text: lines.join("\n").trim(), mentions };
};

const announce = async (socket: any, table: PokerTable, events: PokerEvent[]) => {
    const { text, mentions } = describeEvents(table, events);
    await sendGroup(socket, table.chatId, text, mentions);
};

const finish = async (socket: any, table: PokerTable, reason: string) => {
    const voided = Boolean(table.hand);
    const summary = finishTable(table);
    deleteTable(table.chatId);

    const lines = [
        "🏁 *Mesa encerrada!*",
        reason,
        ...(voided ? ["A mão em andamento foi anulada e as apostas voltaram para cada jogador."] : []),
        "",
        ...summary.map(
            (player) =>
                `${player.name}: buy-in ${formatPrice(player.buyIn)} → ${formatPrice(player.chips)} (${signedPrice(player.balance)})`
        ),
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
            if (ACTIONS.includes(action as PokerAction)) return play(params, action as PokerAction, args);

            throw new WarningError(`Subcomando "${subcommand}" não existe. Use ${POKER} ajuda.`);
        });
    },
};
