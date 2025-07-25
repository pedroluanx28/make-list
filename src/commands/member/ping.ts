import { PREFIX } from "../../config";

export const ping: Command= {
    name: "ping",
    description: "Verificar conexão com o bot",
    commands: ["ping"],
    usage: `${PREFIX}ping`,
    handle: async ({ sendReply, sendReact }) => {
        await sendReact("🏓");
        await sendReply("Pong! 🏓");
    }
}