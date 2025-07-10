import { PREFIX } from "../../config";

export const markAll = {
    name: "Marcar todos",
    description: "Marca todos os membros de um grupo",
    commands: ["mark-all"],
    usage: `${PREFIX}mark-all`,
    handle: async ({ sendText, socket, remoteJid, sendReact }) => {
        const { participants } = await socket.groupMetadata(remoteJid);

        const mentions = participants.map(({ id }) => id);
        const message = participants.map(({ id }) => `@${id}`);

        await sendReact("📢");

        await sendText(`📢 Marcando todos! ${message}`, mentions);
    },
};
