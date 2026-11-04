import { DangerError } from "../errors";

const API_URL = "https://deckofcardsapi.com";
const REQUEST_TIMEOUT_MS = 10000;

// Card codes come from the API: rank (A, K, Q, J, 0 for 10, 9-2) + suit (S, H, D, C)
export const cardImageUrl = (code: string) => `${API_URL}/static/img/${code}.png`;

// "new/draw" shuffles a brand new deck and draws from it in a single request
export const drawCards = async (count: number): Promise<string[]> => {
    let data: any;

    try {
        const response = await fetch(`${API_URL}/api/deck/new/draw/?count=${count}`, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        data = await response.json();
    } catch (error) {
        console.error("Erro ao comprar cartas:", error);
    }

    if (!data?.success || !Array.isArray(data.cards) || data.cards.length !== count) {
        throw new DangerError("Não consegui embaralhar as cartas agora (Deck of Cards API indisponível).");
    }

    return data.cards.map((card) => card.code);
};
