import { TIMEOUT_BY_EVENT } from "./config";
import { onMessagesUpsert } from "./middlewares/onMessagesUpsert";

export const load = (socket) => {
    socket.ev.on("messages.upsert", ({ messages }) => {
        setTimeout(() => {
            onMessagesUpsert({ socket, messages });
        }, TIMEOUT_BY_EVENT) //Prevenir ban do WhatsApp
    })
}