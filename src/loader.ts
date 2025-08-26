import { TIMEOUT_BY_EVENT } from "./config";
import { onMessagesUpsert } from "./middlewares/onMessagesUpsert";
import { initializeReminders } from "./utils/reminderManager";

export const load = (socket) => {
    socket.ev.on("messages.upsert", ({ messages, type }) => {
        // Só processar mensagens novas (não antigas)
        if (type === 'notify') {
            setTimeout(() => {
                onMessagesUpsert({ socket, messages });
            }, TIMEOUT_BY_EVENT) //Prevenir ban do WhatsApp
        }
    })

    // Inicializar lembretes pendentes
    initializeReminders(socket);
}