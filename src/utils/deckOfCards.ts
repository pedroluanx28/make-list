import sharp from "sharp";
import { DangerError } from "../errors";

const API_URL = "https://deckofcardsapi.com";
const REQUEST_TIMEOUT_MS = 10000;
const STICKER_SIZE = 512;

// Card codes come from the API: rank (A, K, Q, J, 0 for 10, 9-2) + suit (S, H, D, C)
export const cardImageUrl = (code: string) => `${API_URL}/static/img/${code}.png`;

// WhatsApp stickers require an actual webp image, not just a renamed PNG
export const cardStickerBuffer = async (code: string): Promise<Buffer> => {
    const response = await fetch(cardImageUrl(code), {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const pngBuffer = Buffer.from(await response.arrayBuffer());

    return sharp(pngBuffer)
        .resize(STICKER_SIZE, STICKER_SIZE, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp()
        .toBuffer();
};

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
