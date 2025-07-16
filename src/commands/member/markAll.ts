import { PREFIX } from "../../config";

export const markAll: Command = {
    name: "markAll",
    description: "Marca todos os membros de um grupo",
    commands: ["markall", "all", "todes"],
    usage: `${PREFIX}markall`,
    handle: async ({ sendText, sendReact, sendReply, fullArgs, isGroup, getGroupParticipants }) => {
        const participants = await getGroupParticipants();

        if (!participants?.length) {
            return sendReply("Não consegui obter os membros do grupo.");
        }

        const mentions = participants.map(({ id }) => id);

        const message = participants.map(({ id }) => `@${id.split("@")[0]}`).join("\n");

        await sendReact("");

        await sendReply(`📢 *ATENÇÃO* \n ${message}`, mentions);

        if (fullArgs) {
            await sendText(fullArgs);
        }

        if (!isGroup) {
            return sendReply("Este comando só pode ser usado em grupos.");
        }
    },
};
