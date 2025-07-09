import { PREFIX } from "../../config";

export const goodNight = {
    name: "Boa noite",
    description: "Pra dar boa noitch",
    commands: ["good-night"],
    usage: `${PREFIX}good-night`,
    handle: async ({ sendReply }) => {
        await sendReply("Boa noitch");
    }
}