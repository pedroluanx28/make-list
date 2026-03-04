import { PREFIX } from "../../config";
import { getOrder, closeAndSendResults } from "../../utils/pedidoManager";

export const pedidoEncerrar: Command = {
    name: "Encerrar Pedido",
    description: "Encerrar o pedido ativo manualmente",
    commands: ["pedido-encerrar", "lidineide-encerrar"],
    usage: `${PREFIX}pedido-encerrar`,
    handle: async ({ socket, remoteJid, sendReply, sendErrorReply }) => {
        const order = getOrder(remoteJid);

        if (!order) {
            await sendErrorReply("Não há pedido ativo neste grupo.");
            return;
        }

        await sendReply("⏹️ Encerrando pedido manualmente...");
        await closeAndSendResults(socket, remoteJid);
    },
};
