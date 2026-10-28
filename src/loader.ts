import { TIMEOUT_BY_EVENT } from "./config";
import { onMessagesUpsert } from "./middlewares/onMessagesUpsert";

// Runs for every socket, including the ones created when the connection drops and reconnects
export const listenToMessages = (socket) => {
    socket.ev.on("messages.upsert", ({ messages, type }) => {
        // Só processar mensagens novas (não antigas)
        if (type === 'notify') {
            setTimeout(() => {
                onMessagesUpsert({ socket, messages });
            }, TIMEOUT_BY_EVENT) //Prevenir ban do WhatsApp
        }
    })
}