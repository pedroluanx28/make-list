const SUIT_SYMBOLS = { S: "♠️", H: "♥️", D: "♦️", C: "♣️" };

// "0H" -> "[10♥️]"
export const formatCard = (code: string) => {
    const rank = code[0] === "0" ? "10" : code[0];
    return `[${rank}${SUIT_SYMBOLS[code[1]]}]`;
};

export const formatCards = (codes: string[]) => codes.map(formatCard).join(" ");
