import { createHash } from "crypto";
import { decryptPollVote, jidNormalizedUser, proto } from "@whiskeysockets/baileys";
import { BOT_EMOJI } from "../config";
import { MenuItem, formatPrice } from "./menuManager";

export type ActiveOrder = {
    chatId: string;
    creatorJid: string; // who opened the order; only they can close it manually
    pollMessageId: string;
    pollEncKey: Uint8Array; // messageContextInfo.messageSecret of the poll
    pollCreatorJids: string[]; // bot JIDs (PN and LID); votes are encrypted with one of them
    menuItems: MenuItem[]; // snapshot of the menu used as poll options
    votes: Map<string, Set<string>>; // voterJid -> set of selected item names
    startTime: number;
    endTime: number;
    timeoutId: ReturnType<typeof setTimeout>;
};

// Node's setTimeout fires immediately for delays above 2^31-1 ms (~24.8 days)
export const MAX_ORDER_MINUTES = 24 * 60;

// In-memory storage: chatId -> ActiveOrder
const activeOrders = new Map<string, ActiveOrder>();

// Chats whose poll is being sent: reserved before the await so two /pedido can't both pass the check
const pendingOrders = new Set<string>();

function hashOption(name: string): string {
    return createHash("sha256").update(name).digest("hex");
}

export function reserveOrder(chatId: string): boolean {
    if (activeOrders.has(chatId) || pendingOrders.has(chatId)) return false;

    pendingOrders.add(chatId);
    return true;
}

export function releaseOrderReservation(chatId: string): void {
    pendingOrders.delete(chatId);
}

export function createOrder(
    chatId: string,
    creatorJid: string,
    pollMessageId: string,
    pollEncKey: Uint8Array,
    pollCreatorJids: string[],
    menuItems: MenuItem[],
    durationMs: number,
    closeCallback: () => void | Promise<void>
): void {
    const existing = activeOrders.get(chatId);
    if (existing) {
        clearTimeout(existing.timeoutId);
    }

    const onTimeout = async () => {
        // An unhandled rejection inside a timer would stop the whole bot
        try {
            await closeCallback();
        } catch (error) {
            console.error(`Erro ao encerrar o pedido de ${chatId}:`, error);
        }
    };

    const order: ActiveOrder = {
        chatId,
        creatorJid,
        pollMessageId,
        pollEncKey,
        pollCreatorJids,
        menuItems,
        votes: new Map(),
        startTime: Date.now(),
        endTime: Date.now() + durationMs,
        timeoutId: setTimeout(onTimeout, durationMs),
    };

    activeOrders.set(chatId, order);
    pendingOrders.delete(chatId);
}

export function getOrder(chatId: string): ActiveOrder | undefined {
    return activeOrders.get(chatId);
}

export function hasOpenOrder(): boolean {
    return activeOrders.size > 0 || pendingOrders.size > 0;
}

export function closeOrder(chatId: string): ActiveOrder | null {
    const order = activeOrders.get(chatId);
    if (!order) return null;

    clearTimeout(order.timeoutId);
    activeOrders.delete(chatId);

    return order;
}

function decryptSelectedOptions(
    order: ActiveOrder,
    voterJids: string[],
    encryptedVote: proto.Message.IPollEncValue
): Uint8Array[] | null {
    // In LID-addressed groups the vote is encrypted with LIDs instead of PNs,
    // for the bot (poll creator) and for the voter
    for (const voterJid of voterJids) {
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
                // wrong JID pair: GCM auth fails, try the next one
            }
        }
    }

    return null;
}

// voterJids: every known form of the voter's JID (PN and LID); the first one identifies the voter
export function recordVote(
    pollMessageId: string,
    voterJids: string[],
    encryptedVote: proto.Message.IPollEncValue
): void {
    // Normalize JIDs (remove device suffix like :15)
    const normalizedJids = [...new Set(voterJids.filter(Boolean).map(jidNormalizedUser))];
    if (!normalizedJids.length) return;

    const order = Array.from(activeOrders.values()).find(
        (order) => order.pollMessageId === pollMessageId
    );
    if (!order) return;

    const selectedOptionHashes = decryptSelectedOptions(order, normalizedJids, encryptedVote);
    if (!selectedOptionHashes) {
        console.log(`Não foi possível descriptografar o voto de ${normalizedJids[0]} na enquete ${pollMessageId}`);
        return;
    }

    const namesByHash = new Map(order.menuItems.map((item) => [hashOption(item.name), item.name]));
    const selectedNames = new Set<string>();
    for (const hash of selectedOptionHashes) {
        const name = namesByHash.get(Buffer.from(hash).toString("hex"));
        if (name) selectedNames.add(name);
    }

    // Replace the voter's selection (WhatsApp polls reflect current state)
    order.votes.set(normalizedJids[0], selectedNames);
}

export function buildSummaryMessages(order: ActiveOrder): {
    summary: string;
    totals: string;
    mentions: string[];
} {
    const itemCounts = new Map<string, number>();
    for (const item of order.menuItems) {
        itemCounts.set(item.name, 0);
    }

    const userTotals = new Map<string, number>(); // voterJid -> total in cents

    for (const [voterJid, votedItems] of order.votes.entries()) {
        let userTotal = 0;
        for (const itemName of votedItems) {
            itemCounts.set(itemName, (itemCounts.get(itemName) || 0) + 1);
            const item = order.menuItems.find((i) => i.name === itemName);
            if (item) userTotal += item.price;
        }
        if (userTotal > 0) {
            userTotals.set(voterJid, userTotal);
        }
    }

    // Summary — item counts only, no prices
    const summaryLines = order.menuItems
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
        totalLines.push(`@${phone} — ${formatPrice(total)}`);
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
