import { PREFIX } from "../../config";
import { WarningError } from "../../errors";
import { getOrder, closeAndSendResults } from "../../utils/pedidoManager";

export const pedidoEncerrar: Command = {
    name: "Encerrar Pedido",
    description: "Encerrar manualmente o pedido ativo (somente quem abriu)",
    commands: ["pedido-encerrar", "lidineide-encerrar"],
    usage: `${PREFIX}pedido-encerrar`,
    handle: async ({ socket, remoteJid, userJid, sendReply, sendErrorReply }) => {
        const order = getOrder(remoteJid);

        if (!order) {
            await sendErrorReply("Não há pedido ativo neste grupo.");
            return;
        }

        if (order.creatorJid !== userJid) {
            throw new WarningError("Somente quem abriu o pedido pode encerrá-lo antes do tempo.");
        }

        await sendReply("⏹️ Encerrando pedido manualmente...");
        await closeAndSendResults(socket, remoteJid);
    },
};
