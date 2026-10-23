import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { PREFIX } from "../../config";
import { getMenuItems } from "../../utils/menuManager";
import {
    MAX_ORDER_MINUTES,
    createOrder,
    closeAndSendResults,
    releaseOrderReservation,
    reserveOrder,
} from "../../utils/pedidoManager";

export const pedido: Command = {
    name: "Pedido",
    description: "Criar um pedido com enquete temporizada",
    commands: ["pedido", "lidineide"],
    usage: `${PREFIX}pedido <tempo_em_minutos>\nExemplo: ${PREFIX}pedido 30`,
    handle: async ({ socket, remoteJid, userJid, sendReply, sendErrorReply, fullArgs }) => {
        const timeStr = fullArgs.trim();

        if (!timeStr) {
            await sendErrorReply(
                `Uso: ${PREFIX}pedido <tempo_em_minutos>\nExemplo: ${PREFIX}pedido 30`
            );
            return;
        }

        if (!/^\d+$/.test(timeStr)) {
            await sendErrorReply(
                `Tempo inválido! Informe um número inteiro positivo de minutos.\nExemplo: ${PREFIX}pedido 30`
            );
            return;
        }

        const minutes = parseInt(timeStr, 10);

        if (minutes <= 0) {
            await sendErrorReply(
                `Tempo inválido! O tempo deve ser maior que zero.\nExemplo: ${PREFIX}pedido 30`
            );
            return;
        }

        if (minutes > MAX_ORDER_MINUTES) {
            await sendErrorReply(
                `Tempo inválido! O tempo máximo é de ${MAX_ORDER_MINUTES} minutos (24 horas).`
            );
            return;
        }

        if (!reserveOrder(remoteJid)) {
            await sendErrorReply(
                `Já existe um pedido ativo neste grupo! Aguarde o fim do tempo ou peça para quem abriu usar ${PREFIX}pedido-encerrar.`
            );
            return;
        }

        try {
            const menuItems = getMenuItems();

            const pollResult = await socket.sendMessage(remoteJid, {
                poll: {
                    name: "🍽️ Pedido — Escolha seus itens:",
                    values: menuItems.map((item) => item.name),
                    selectableCount: 0,
                },
            });

            const pollMessageId = pollResult?.key?.id;
            const pollEncKey = pollResult?.message?.messageContextInfo?.messageSecret;

            if (!pollMessageId || !pollEncKey) {
                await sendErrorReply("Erro ao criar a enquete do pedido.");
                return;
            }

            // Votes are encrypted with the poll creator's JID (the bot), not the group's
            const pollCreatorJids = [socket.user?.id, socket.user?.lid]
                .filter(Boolean)
                .map(jidNormalizedUser);

            const durationMs = minutes * 60 * 1000;

            createOrder(remoteJid, userJid, pollMessageId, pollEncKey, pollCreatorJids, menuItems, durationMs, async () => {
                await closeAndSendResults(socket, remoteJid);
            });
        } finally {
            // No-op once createOrder has registered the order
            releaseOrderReservation(remoteJid);
        }

        const timeDisplay = minutes === 1 ? "1 minuto" : `${minutes} minutos`;
        await sendReply(
            `✅ Pedido criado! A enquete ficará aberta por ${timeDisplay}.\n\nVote nos itens que deseja pedir! 🛒`
        );
    },
};
