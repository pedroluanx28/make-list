import fs from "fs";
import path from "path";
import { InvalidParameterError, WarningError } from "../errors";
import { formatPrice } from "./menuManager";
import { compareScores, evaluateHand } from "./pokerHand";

// All amounts are in cents (10 = R$ 0,10)
export const DEFAULT_MINIMUM = 10;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
export const MIN_BUY_IN_MULTIPLIER = 10;
export const MAX_BUY_IN_MULTIPLIER = 200;
export const TIME_BANK_EXTENSIONS = 3;
const MAX_NAME_LENGTH = 20;
const BOARD_SIZE = 5;

export type Street = "preflop" | "flop" | "turn" | "river";

export type PokerAction = "check" | "call" | "raise" | "fold" | "allin";

export type PokerPlayer = {
    jid: string;
    name: string;
    buyIn: number;
    chips: number; // chips behind, not counting what is already in the pot
    cards: string[];
    bet: number; // put in during the current street
    committed: number; // put in during the whole hand
    inHand: boolean; // dealt into the current hand
    folded: boolean;
    allIn: boolean;
    acted: boolean; // acted since the last full raise
    mayRaise: boolean; // false after an all-in below the minimum raise: only call or fold
    timeBank?: number; // extensions left for the whole table; missing on tables saved before it existed
    left?: boolean; // left with .poker sair: keeps the seat only for the final summary
};

export type PokerHand = {
    street: Street;
    board: string[];
    deck: string[]; // board cards still to be revealed
    current: number; // seat of the player to act
    currentBet: number;
    minRaise: number;
};

export type PokerTable = {
    chatId: string;
    minimum: number; // big blind
    smallBlind: number;
    players: PokerPlayer[]; // seat order = join order
    started: boolean;
    dealer: number; // seat of the button, -1 before the first hand
    handNumber: number;
    hand: PokerHand | null;
};

export type ShowdownHand = { jid: string; cards: string[]; handName: string };
export type PotResult = { amount: number; winners: string[] };

export type PokerEvent =
    | { type: "blinds"; smallBlind: string; bigBlind: string }
    | { type: "action"; jid: string; action: PokerAction; total: number; allIn: boolean }
    | { type: "street"; street: Street; cards: string[]; board: string[] }
    | { type: "turn"; jid: string }
    | { type: "foldWin"; jid: string; amount: number }
    | { type: "showdown"; hands: ShowdownHand[]; pots: PotResult[] };

export type PlayerSummary = { name: string; buyIn: number; chips: number; balance: number; left: boolean };

const POKER_FILE = path.join(__dirname, "../../assets/poker.json");

const loadTables = (): Record<string, PokerTable> => {
    if (!fs.existsSync(POKER_FILE)) {
        return {};
    }

    try {
        const tables = JSON.parse(fs.readFileSync(POKER_FILE, "utf8"));
        if (tables && typeof tables === "object" && !Array.isArray(tables)) {
            return tables;
        }
    } catch (error) {
        console.error("Erro ao carregar mesas de poker:", error);
    }

    return {};
};

const saveTables = (tables: Record<string, PokerTable>) => {
    const dir = path.dirname(POKER_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(POKER_FILE, JSON.stringify(tables, null, 2));
};

export const getTable = (chatId: string): PokerTable | null => loadTables()[chatId] ?? null;

export const getAllTables = (): PokerTable[] => Object.values(loadTables());

export const saveTable = (table: PokerTable) => {
    const tables = loadTables();
    tables[table.chatId] = table;
    saveTables(tables);
};

export const deleteTable = (chatId: string) => {
    const tables = loadTables();
    delete tables[chatId];
    saveTables(tables);
};

// Commands of the same group run one at a time, so two actions never interleave across awaits
const locks = new Map<string, Promise<unknown>>();

export const withTableLock = <T>(chatId: string, task: () => Promise<T>): Promise<T> => {
    const previous = locks.get(chatId) ?? Promise.resolve();
    const run = previous.then(task);
    const tail = run.catch(() => undefined);

    locks.set(chatId, tail);
    tail.then(() => {
        if (locks.get(chatId) === tail) {
            locks.delete(chatId);
        }
    });

    return run;
};

// "0.10", "0,10" and "50" are accepted
export const parseAmount = (text: string): number => {
    if (!/^\d+([.,]\d{1,2})?$/.test(text ?? "")) {
        throw new InvalidParameterError(`"${text ?? ""}" não é um valor válido. Use, por exemplo, 0.10 ou 50.`);
    }

    const cents = Math.round(parseFloat(text.replace(",", ".")) * 100);
    if (cents <= 0) {
        throw new InvalidParameterError("o valor precisa ser maior que zero.");
    }

    return cents;
};

export const createTable = (chatId: string, minimum: number = DEFAULT_MINIMUM): PokerTable => {
    const smallBlind = Math.floor(minimum / 2);
    if (smallBlind < 1) {
        throw new InvalidParameterError(`o mínimo da mesa precisa ser de pelo menos ${formatPrice(2)}.`);
    }

    return {
        chatId,
        minimum,
        smallBlind,
        players: [],
        started: false,
        dealer: -1,
        handNumber: 0,
        hand: null,
    };
};

export const minBuyIn = (table: PokerTable) => table.minimum * MIN_BUY_IN_MULTIPLIER;
export const maxBuyIn = (table: PokerTable) => table.minimum * MAX_BUY_IN_MULTIPLIER;

export const addPlayer = (table: PokerTable, jid: string, name: string, buyIn: number): PokerPlayer => {
    if (table.started) {
        throw new WarningError("A mesa já começou; não dá para entrar agora.");
    }

    if (table.players.some((player) => player.jid === jid)) {
        throw new WarningError("Você já está na mesa.");
    }

    if (table.players.length >= MAX_PLAYERS) {
        throw new WarningError(`A mesa está cheia (${MAX_PLAYERS} jogadores).`);
    }

    if (!name || name.length > MAX_NAME_LENGTH) {
        throw new InvalidParameterError(`o nome precisa ter de 1 a ${MAX_NAME_LENGTH} caracteres, sem espaços.`);
    }

    if (table.players.some((player) => player.name.toLowerCase() === name.toLowerCase())) {
        throw new WarningError(`Já tem um jogador chamado ${name} na mesa. Escolha outro nome.`);
    }

    if (buyIn < minBuyIn(table)) {
        throw new InvalidParameterError(
            `o buy-in mínimo é ${formatPrice(minBuyIn(table))} (${MIN_BUY_IN_MULTIPLIER} vezes o mínimo da mesa).`
        );
    }

    if (buyIn > maxBuyIn(table)) {
        throw new InvalidParameterError(
            `o buy-in máximo é ${formatPrice(maxBuyIn(table))} (${MAX_BUY_IN_MULTIPLIER} vezes o mínimo da mesa).`
        );
    }

    const player: PokerPlayer = {
        jid,
        name,
        buyIn,
        chips: buyIn,
        cards: [],
        bet: 0,
        committed: 0,
        inHand: false,
        folded: false,
        allIn: false,
        acted: false,
        mayRaise: true,
        timeBank: TIME_BANK_EXTENSIONS,
    };

    table.players.push(player);
    return player;
};

export const timeBankLeft = (player: PokerPlayer) => player.timeBank ?? TIME_BANK_EXTENSIONS;

// Spends one extension of the player; returns how many are left, or null when there were none
export const useTimeBank = (table: PokerTable, jid: string): number | null => {
    const player = table.players.find((seated) => seated.jid === jid)!;
    const left = timeBankLeft(player);
    if (left === 0) {
        return null;
    }

    player.timeBank = left - 1;
    return player.timeBank;
};

const canPlay = (player: PokerPlayer) => player.chips > 0 && !player.left;

export const playersWithChips = (table: PokerTable) => table.players.filter(canPlay);

export const potTotal = (table: PokerTable) =>
    table.players.reduce((total, player) => total + player.committed, 0);

export const currentPlayer = (table: PokerTable): PokerPlayer | null =>
    table.hand ? table.players[table.hand.current] : null;

// Next seat clockwise from `from` (exclusive) whose player matches, or -1
const nextSeat = (table: PokerTable, from: number, matches: (player: PokerPlayer) => boolean) => {
    const count = table.players.length;
    for (let step = 1; step <= count; step++) {
        const seat = (from + step) % count;
        if (matches(table.players[seat])) return seat;
    }
    return -1;
};

const isActive = (player: PokerPlayer) => player.inHand && !player.folded;
const canAct = (player: PokerPlayer) => isActive(player) && !player.allIn;

const pay = (player: PokerPlayer, amount: number) => {
    const paid = Math.min(amount, player.chips);
    player.chips -= paid;
    player.bet += paid;
    player.committed += paid;
    if (player.chips === 0) {
        player.allIn = true;
    }
};

// Number of cards a hand needs: 2 per player with chips + the board
export const cardsNeeded = (table: PokerTable) => playersWithChips(table).length * 2 + BOARD_SIZE;

export const startHand = (table: PokerTable, cards: string[]): PokerEvent[] => {
    if (playersWithChips(table).length < MIN_PLAYERS) {
        throw new WarningError(`São necessários pelo menos ${MIN_PLAYERS} jogadores com fichas para jogar.`);
    }

    table.started = true;
    table.handNumber += 1;
    table.dealer = nextSeat(table, table.dealer, canPlay);

    const deck = [...cards];
    for (let step = 0; step < table.players.length; step++) {
        const player = table.players[(table.dealer + step) % table.players.length];
        Object.assign(player, {
            inHand: canPlay(player),
            cards: [],
            bet: 0,
            committed: 0,
            folded: false,
            allIn: false,
            acted: false,
            mayRaise: true,
        });
        if (player.inHand) {
            player.cards = deck.splice(0, 2);
        }
    }

    const { smallBlind, bigBlind } = blindSeats(table);
    pay(table.players[smallBlind], table.smallBlind);
    pay(table.players[bigBlind], table.minimum);

    table.hand = {
        street: "preflop",
        board: [],
        deck: deck.slice(0, BOARD_SIZE),
        // Preflop starts left of the big blind (in heads-up that is the button)
        current: bigBlind,
        currentBet: table.minimum,
        minRaise: table.minimum,
    };

    return [
        { type: "blinds", smallBlind: table.players[smallBlind].jid, bigBlind: table.players[bigBlind].jid },
        ...proceed(table),
    ];
};

// Heads-up: the button posts the small blind and acts first preflop
const blindSeats = (table: PokerTable) => {
    const headsUp = table.players.filter(isActive).length === 2;
    const smallBlind = headsUp ? table.dealer : nextSeat(table, table.dealer, isActive);
    return { smallBlind, bigBlind: nextSeat(table, smallBlind, isActive) };
};

const minimumRaiseTo = (table: PokerTable) => {
    const hand = table.hand!;
    return hand.currentBet === 0 ? table.minimum : hand.currentBet + hand.minRaise;
};

const defaultRaiseTo = (table: PokerTable) => {
    const hand = table.hand!;
    return hand.currentBet === 0 ? table.minimum : hand.currentBet * 2;
};

const raiseTo = (table: PokerTable, player: PokerPlayer, total: number) => {
    const hand = table.hand!;
    pay(player, total - player.bet);

    if (total <= hand.currentBet) return;

    const raiseBy = total - hand.currentBet;
    const fullRaise = raiseBy >= hand.minRaise;
    if (fullRaise) {
        hand.minRaise = raiseBy;
    }

    for (const other of table.players) {
        if (other === player || !canAct(other)) continue;
        // An incomplete raise (short all-in) does not reopen the betting for who already acted
        if (fullRaise) {
            other.mayRaise = true;
        } else if (other.acted) {
            other.mayRaise = false;
        }
        other.acted = false;
    }

    hand.currentBet = total;
};

export const applyAction = (table: PokerTable, jid: string, action: PokerAction, amount?: number): PokerEvent[] => {
    const hand = table.hand;
    if (!hand) {
        throw new WarningError("Nenhuma mão em andamento. Use .poker iniciar.");
    }

    const player = table.players[hand.current];
    if (player.jid !== jid) {
        const seated = table.players.find((other) => other.jid === jid);
        if (!seated || !isActive(seated)) {
            throw new WarningError("Você não está jogando esta mão.");
        }
        throw new WarningError(`Não é sua vez. Agora é a vez de ${player.name}.`);
    }

    const toCall = hand.currentBet - player.bet;
    let effective: PokerAction = action;

    switch (action) {
        case "check":
            if (toCall > 0) {
                throw new WarningError(
                    `Não dá para dar check: há ${formatPrice(toCall)} para pagar. Use call, raise, allin ou fold.`
                );
            }
            break;
        case "call":
            if (toCall === 0) {
                throw new WarningError("Não há aposta para pagar. Use check.");
            }
            pay(player, toCall);
            break;
        case "raise": {
            if (!player.mayRaise) {
                throw new WarningError("Você não pode aumentar agora: o último all-in não reabriu as apostas. Use call ou fold.");
            }
            const target = amount ?? defaultRaiseTo(table);
            const maxTotal = player.bet + player.chips;
            if (target > maxTotal) {
                throw new WarningError(`Você só tem ${formatPrice(player.chips)} em fichas. Para apostar tudo, use allin.`);
            }
            if (target < maxTotal && target < minimumRaiseTo(table)) {
                throw new WarningError(`O raise mínimo é para ${formatPrice(minimumRaiseTo(table))}.`);
            }
            if (target <= hand.currentBet) {
                throw new WarningError(`O raise precisa passar a aposta atual de ${formatPrice(hand.currentBet)}.`);
            }
            raiseTo(table, player, target);
            break;
        }
        case "allin": {
            const total = player.bet + player.chips;
            if (!player.mayRaise && total > hand.currentBet) {
                throw new WarningError("Você não pode aumentar agora: o último all-in não reabriu as apostas. Use call ou fold.");
            }
            raiseTo(table, player, total);
            break;
        }
        case "fold":
            player.folded = true;
            break;
    }

    if (player.allIn) {
        effective = "allin";
    }
    player.acted = true;

    return [
        { type: "action", jid, action: effective, total: player.bet, allIn: player.allIn },
        ...proceed(table),
    ];
};

const STREET_CARDS: Record<Exclude<Street, "preflop">, number> = { flop: 3, turn: 1, river: 1 };
const NEXT_STREET: Record<Exclude<Street, "river">, Exclude<Street, "preflop">> = {
    preflop: "flop",
    flop: "turn",
    turn: "river",
};

// Moves the hand forward until someone has to act or the hand ends
const proceed = (table: PokerTable): PokerEvent[] => {
    const hand = table.hand!;
    const events: PokerEvent[] = [];

    for (;;) {
        const active = table.players.filter(isActive);
        if (active.length === 1) {
            return [...events, winByFold(table, active[0])];
        }

        const actors = active.filter((player) => !player.allIn);
        const bettingOver = actors.length <= 1 && actors.every((player) => player.bet >= hand.currentBet);

        if (!bettingOver) {
            const next = nextSeat(
                table,
                hand.current,
                (player) => canAct(player) && (!player.acted || player.bet < hand.currentBet)
            );
            if (next !== -1) {
                hand.current = next;
                return [...events, { type: "turn", jid: table.players[next].jid }];
            }
        }

        if (hand.street === "river") {
            return [...events, showdown(table)];
        }

        for (const player of table.players) {
            player.bet = 0;
            player.acted = false;
            player.mayRaise = true;
        }
        hand.currentBet = 0;
        hand.minRaise = table.minimum;
        hand.street = NEXT_STREET[hand.street];

        const cards = hand.deck.splice(0, STREET_CARDS[hand.street]);
        hand.board.push(...cards);
        events.push({ type: "street", street: hand.street, cards, board: [...hand.board] });

        // After the flop the first to act is the first active player left of the button
        hand.current = table.dealer;
    }
};

const endHand = (table: PokerTable) => {
    table.hand = null;
    for (const player of table.players) {
        Object.assign(player, { cards: [], bet: 0, committed: 0, inHand: false, folded: false, allIn: false, acted: false });
    }
};

const winByFold = (table: PokerTable, winner: PokerPlayer): PokerEvent => {
    const amount = potTotal(table);
    winner.chips += amount;
    endHand(table);
    return { type: "foldWin", jid: winner.jid, amount };
};

// Main pot and side pots: one layer per distinct all-in level of the players still in the hand
const buildPots = (table: PokerTable) => {
    const contenders = table.players.filter(isActive);
    // Each level leaves out at least one contender, so no two pots have the same eligible players
    const levels = [...new Set(contenders.map((player) => player.committed))]
        .filter((level) => level > 0)
        .sort((a, b) => a - b);

    return levels.map((level, index) => {
        const previous = index === 0 ? 0 : levels[index - 1];
        const amount = table.players.reduce(
            (total, player) => total + Math.max(0, Math.min(player.committed, level) - previous),
            0
        );
        return { amount, eligible: contenders.filter((player) => player.committed >= level) };
    });
};

const showdown = (table: PokerTable): PokerEvent => {
    const board = table.hand!.board;
    const contenders = table.players.filter(isActive);
    const values = new Map(contenders.map((player) => [player, evaluateHand([...player.cards, ...board])]));
    // Odd chips go to the first winner left of the button
    const seatOrder = (player: PokerPlayer) =>
        (table.players.indexOf(player) - table.dealer - 1 + table.players.length) % table.players.length;

    const pots: PotResult[] = buildPots(table).map(({ amount, eligible }) => {
        const best = eligible.reduce((top, player) =>
            compareScores(values.get(player)!.score, values.get(top)!.score) > 0 ? player : top
        );
        const winners = eligible
            .filter((player) => compareScores(values.get(player)!.score, values.get(best)!.score) === 0)
            .sort((a, b) => seatOrder(a) - seatOrder(b));

        const share = Math.floor(amount / winners.length);
        winners.forEach((player) => (player.chips += share));
        winners[0].chips += amount - share * winners.length;

        return { amount, winners: winners.map((player) => player.jid) };
    });

    const hands = contenders.map((player) => ({
        jid: player.jid,
        cards: player.cards,
        handName: values.get(player)!.name,
    }));

    endHand(table);
    return { type: "showdown", hands, pots };
};

// Actions the player to act can take now, as "command → description" lines
export const getOptions = (table: PokerTable): string[] => {
    const hand = table.hand!;
    const player = table.players[hand.current];
    const toCall = hand.currentBet - player.bet;
    const maxTotal = player.bet + player.chips;
    const options: string[] = [];

    if (toCall === 0) {
        options.push("check → passar a vez sem apostar");
    } else if (player.chips > toCall) {
        options.push(`call → pagar ${formatPrice(toCall)}`);
    } else {
        options.push(`call → pagar ${formatPrice(player.chips)} (all-in)`);
    }

    if (player.mayRaise && maxTotal > minimumRaiseTo(table)) {
        options.push(
            hand.currentBet === 0
                ? `raise [valor] → apostar (padrão: ${formatPrice(defaultRaiseTo(table))})`
                : `raise [valor] → aumentar a aposta para [valor] (padrão: o dobro, ${formatPrice(defaultRaiseTo(table))}; mínimo ${formatPrice(minimumRaiseTo(table))})`
        );
    }

    options.push("fold → desistir da mão");

    if (player.mayRaise || player.chips <= toCall) {
        options.push(`allin → apostar todas as suas fichas (${formatPrice(maxTotal)})`);
    }

    return options;
};

// Ends the table: a hand in progress is voided and the bets go back to the players still seated
export const finishTable = (table: PokerTable): PlayerSummary[] => {
    if (table.hand) {
        for (const player of table.players) {
            // Who left already lost the bets, as announced when they left
            if (!player.left) {
                player.chips += player.committed;
            }
        }
        endHand(table);
    }

    return table.players.map((player) => ({
        name: player.name,
        buyIn: player.buyIn,
        chips: player.chips,
        balance: player.chips - player.buyIn,
        left: Boolean(player.left),
    }));
};

// Before the first hand the player just gives up the seat; after it, a hand in progress is folded
// and the player keeps the seat only to show up in the final summary
export const leaveTable = (table: PokerTable, jid: string): PokerEvent[] => {
    const player = table.players.find((seated) => seated.jid === jid);
    if (!player || player.left) {
        throw new WarningError("Você não está na mesa.");
    }

    if (!table.started) {
        table.players.splice(table.players.indexOf(player), 1);
        return [];
    }

    let events: PokerEvent[] = [];
    if (table.hand && isActive(player)) {
        if (table.players[table.hand.current] === player) {
            events = applyAction(table, jid, "fold");
        } else {
            // Out of turn: the player to act keeps the turn
            player.folded = true;
            events = [{ type: "action", jid, action: "fold", total: player.bet, allIn: false }];
            const active = table.players.filter(isActive);
            if (active.length === 1) {
                events.push(winByFold(table, active[0]));
            }
        }
    }

    player.left = true;
    return events;
};
