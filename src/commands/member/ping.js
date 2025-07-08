const { PREFIX } = require("../../config");

module.exports = {
    name: "ping",
    description: "Verificar conexão com o bot",
    commands: ["ping"],
    usage: `${PREFIX}ping`,
    handle: async ({ sendReply, sendReact }) => {
        await sendReact("🏓");
        await sendReply("Pong! 🏓");
    }
}