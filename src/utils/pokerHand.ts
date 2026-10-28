const SUIT_SYMBOLS = { S: "♠️", H: "♥️", D: "♦️", C: "♣️" };

// "0H" -> "[10♥️]"
export const formatCard = (code: string) => {
    const rank = code[0] === "0" ? "10" : code[0];
    return `[${rank}${SUIT_SYMBOLS[code[1]]}]`;
};

export const formatCards = (codes: string[]) => codes.map(formatCard).join(" ");

const RANK_VALUES = { A: 14, K: 13, Q: 12, J: 11, "0": 10 };

const HAND_NAMES = [
    "Carta alta",
    "Par",
    "Dois pares",
    "Trinca",
    "Sequência",
    "Flush",
    "Full house",
    "Quadra",
    "Straight flush",
];

const STRAIGHT_FLUSH = 8;

export type HandValue = {
    // [category, ...tiebreakers], compared element by element
    score: number[];
    name: string;
};

const rankValue = (code: string) => RANK_VALUES[code[0]] ?? Number(code[0]);

// Highest card of a straight, or 0; the wheel (A-2-3-4-5) counts as 5-high
const straightHigh = (values: number[]) => {
    const unique = [...new Set(values)].sort((a, b) => b - a);
    if (unique.length !== 5) return 0;
    if (unique[0] - unique[4] === 4) return unique[0];
    if (unique.join() === "14,5,4,3,2") return 5;
    return 0;
};

const evaluateFive = (cards: string[]): number[] => {
    const values = cards.map(rankValue);
    const isFlush = cards.every((card) => card[1] === cards[0][1]);
    const high = straightHigh(values);

    if (high && isFlush) return [STRAIGHT_FLUSH, high];

    const counts = new Map<number, number>();
    values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    // Groups ordered by size then value: [trips, pair] for a full house, [high pair, low pair, kicker]...
    const groups = [...counts.entries()].sort(([va, ca], [vb, cb]) => cb - ca || vb - va);
    const ordered = groups.map(([value]) => value);
    const shape = groups.map(([, count]) => count).join("");

    if (shape === "41") return [7, ...ordered];
    if (shape === "32") return [6, ...ordered];
    if (isFlush) return [5, ...ordered];
    if (high) return [4, high];
    if (shape === "311") return [3, ...ordered];
    if (shape === "221") return [2, ...ordered];
    if (shape === "2111") return [1, ...ordered];
    return [0, ...ordered];
};

// Scores of the same category always have the same length; different categories differ at index 0
export const compareScores = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
};

const combinations = (cards: string[], size: number): string[][] => {
    if (size === 0) return [[]];
    if (cards.length < size) return [];
    const [first, ...rest] = cards;
    return [
        ...combinations(rest, size - 1).map((combo) => [first, ...combo]),
        ...combinations(rest, size),
    ];
};

// Best 5-card hand out of 5 to 7 cards (2 in the hand + the board)
export const evaluateHand = (cards: string[]): HandValue => {
    const score = combinations(cards, 5)
        .map(evaluateFive)
        .reduce((best, current) => (compareScores(current, best) > 0 ? current : best));

    const name = score[0] === STRAIGHT_FLUSH && score[1] === 14 ? "Royal flush" : HAND_NAMES[score[0]];

    return { score, name };
};
