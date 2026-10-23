import { PREFIX } from "../../config";
import { readCommandImports } from "../../utils";
import { checkPermission } from "../../middlewares/checkPermission";

const SECTIONS = [
    { type: "member", title: "Membros" },
    { type: "admin", title: "Admins" },
    { type: "owner", title: "Dono" },
];

const formatLine = ({ usage, description }: Command) => {
    // Usages like /pedido carry an example on the following lines, and /cardapio a " — " note on the first one
    const firstLine = usage.split("\n")[0].split(" — ")[0];
    return description ? `• ${firstLine} — ${description}` : `• ${firstLine}`;
};

export const showCommands: Command = {
    name: "Comandos",
    description: "Listar os comandos que você pode usar",
    commands: ["comandos", "ajuda", "help"],
    usage: `${PREFIX}comandos`,
    handle: async ({ sendReply, socket, userJid, remoteJid }) => {
        const commandImports = readCommandImports();
        let message = "📋 *Comandos disponíveis*";

        for (const { type, title } of SECTIONS) {
            const modules = commandImports[type] ?? [];

            if (modules.length === 0 || !await checkPermission({ type, socket, userJid, remoteJid })) {
                continue;
            }

            const lines = modules.map((module) => formatLine(Object.values(module)[0] as Command));
            message += `\n\n*${title}*\n${lines.join("\n")}`;
        }

        await sendReply(message);
    },
};
