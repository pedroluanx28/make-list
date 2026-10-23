import { createHash } from "crypto";
import { decryptPollVote, jidNormalizedUser, proto } from "@whiskeysockets/baileys";
import { BOT_EMOJI } from "../config";

export type MenuItem = {
    name: string;
    price: number; // in cents (e.g. 700 = R$ 7,00)
};

export const MENU_ITEMS: MenuItem[] = [
    { name: "cuscuz", price: 700 },
    { name: "pão de carne", price: 600 },
    { name: "pão de frango", price: 600 },
    { name: "pão de queijo", price: 600 },
    { name: "pão misto", price: 600 },
    { name: "salada P", price: 500 },
    { name: "salada G", price: 1000 },
    { name: "pizza", price: 600 },
];

export type ActiveOrder = {
    chatId: string;
    pollMessageId: string;
    pollEncKey: Uint8Array; // messageContextInfo.messageSecret of the poll
    pollCreatorJids: string[]; // bot JIDs (PN and LID); votes are encrypted with one of them
    votes: Map<string, Set<string>>; // voterJid -> set of selected item names
    startTime: number;
    endTime: number;
    timeoutId: ReturnType<typeof setTimeout>;
    closed: boolean;
};

// In-memory storage: chatId -> ActiveOrder
const activeOrders = new Map<string, ActiveOrder>();

function hashOption(name: string): Buffer {
    return createHash("sha256").update(name).digest();
}

function buffersEqual(a: Buffer, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function createOrder(
    chatId: string,
    pollMessageId: string,
    pollEncKey: Uint8Array,
    pollCreatorJids: string[],
    durationMs: number,
    closeCallback: () => void
): void {
    const existing = activeOrders.get(chatId);
    if (existing && !existing.closed) {
        clearTimeout(existing.timeoutId);
    }

    const order: ActiveOrder = {
        chatId,
        pollMessageId,
        pollEncKey,
        pollCreatorJids,
        votes: new Map(),
        startTime: Date.now(),
        endTime: Date.now() + durationMs,
        timeoutId: setTimeout(closeCallback, durationMs),
        closed: false,
    };

    activeOrders.set(chatId, order);
}

export function getOrder(chatId: string): ActiveOrder | undefined {
    return activeOrders.get(chatId);
}

export function closeOrder(chatId: string): ActiveOrder | null {
    const order = activeOrders.get(chatId);
    if (!order || order.closed) return null;

    clearTimeout(order.timeoutId);
    order.closed = true;
    activeOrders.delete(chatId);

    return order;
}

function decryptSelectedOptions(
    order: ActiveOrder,
    voterJid: string,
    encryptedVote: proto.Message.IPollEncValue
): Uint8Array[] | null {
    // In LID-addressed groups the vote is encrypted with the bot's LID instead of its PN
    for (const pollCreatorJid of order.pollCreatorJids) {
        try {
            const vote = decryptPollVote(encryptedVote, {
                pollCreatorJid,
                pollMsgId: order.pollMessageId,
                pollEncKey: order.pollEncKey,
                voterJid,
            });

            return vote.selectedOptions || [];
        } catch {
            // wrong creator JID: GCM auth fails, try the next one
        }
    }

    return null;
}

export function recordVote(
    pollMessageId: string,
    voterJid: string,
    encryptedVote: proto.Message.IPollEncValue
): void {
    // Normalize JID (remove device suffix like :15)
    const normalizedJid = jidNormalizedUser(voterJid);

    const order = Array.from(activeOrders.values()).find(
        (order) => order.pollMessageId === pollMessageId && !order.closed
    );
    if (!order) return;

    const selectedOptionHashes = decryptSelectedOptions(order, normalizedJid, encryptedVote);
    if (!selectedOptionHashes) {
        console.log(`Não foi possível descriptografar o voto de ${normalizedJid} na enquete ${pollMessageId}`);
        return;
    }

    const selectedNames = new Set<string>();
    for (const hash of selectedOptionHashes) {
        const item = MENU_ITEMS.find((item) => buffersEqual(hashOption(item.name), hash));
        if (item) selectedNames.add(item.name);
    }

    // Replace the voter's selection (WhatsApp polls reflect current state)
    order.votes.set(normalizedJid, selectedNames);
}

export function buildSummaryMessages(order: ActiveOrder): {
    summary: string;
    totals: string;
    mentions: string[];
} {
    const itemCounts = new Map<string, number>();
    for (const item of MENU_ITEMS) {
        itemCounts.set(item.name, 0);
    }

    const userTotals = new Map<string, number>(); // voterJid -> total in cents

    for (const [voterJid, votedItems] of order.votes.entries()) {
        let userTotal = 0;
        for (const itemName of votedItems) {
            itemCounts.set(itemName, (itemCounts.get(itemName) || 0) + 1);
            const item = MENU_ITEMS.find((i) => i.name === itemName);
            if (item) userTotal += item.price;
        }
        if (userTotal > 0) {
            userTotals.set(voterJid, userTotal);
        }
    }

    // Summary — item counts only, no prices
    const summaryLines = MENU_ITEMS
        .filter((item) => (itemCounts.get(item.name) || 0) > 0)
        .map((item) => `- ${item.name}: ${itemCounts.get(item.name)}`);

    const summary =
        summaryLines.length > 0
            ? `📦 Pedido encerrado!\n\nResumo:\n${summaryLines.join("\n")}`
            : `📦 Pedido encerrado!\n\nNenhum voto registrado.`;

    // Totals per person with mention tags
    const mentions: string[] = [];
    const totalLines: string[] = [];

    for (const [voterJid, total] of userTotals.entries()) {
        mentions.push(voterJid);
        const phone = voterJid.split("@")[0];
        const reais = (total / 100).toFixed(2).replace(".", ",");
        totalLines.push(`@${phone} — R$ ${reais}`);
    }

    const totals =
        totalLines.length > 0
            ? `💰 Totais individuais:\n\n${totalLines.join("\n")}`
            : `💰 Nenhum pagamento a registrar.`;

    return { summary, totals, mentions };
}

export async function closeAndSendResults(
    socket: any,
    chatId: string
): Promise<void> {
    const order = closeOrder(chatId);
    if (!order) return;

    const { summary, totals, mentions } = buildSummaryMessages(order);

    await socket.sendMessage(chatId, { text: `${BOT_EMOJI} ${summary}` });
    await socket.sendMessage(chatId, {
        text: `${BOT_EMOJI} ${totals}`,
        mentions,
    });
}
