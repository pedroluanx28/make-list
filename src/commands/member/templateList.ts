import { PREFIX } from "../../config";

type TemplateListArgs = {
    local: string;
    valor: string;
    titulo: string;
    horario: string;
}

export const templateList: Command = {
    name: "Template de Lista",
    description: "Cria um template de lista",
    commands: ["racha", "templatelist"],
    usage: `${PREFIX}templatelist`,
    handle: async ({ fullArgs, sendReply }) => {
        const helpArg = "--help";

        if (fullArgs.includes(helpArg)) {
            await sendReply(`\n*Aqui estão as variaveis que você pode usar:*\n_local:_ Local do racha\n_valor:_ Preço do racha por pessoa\n_titulo:_ Título do template\n_horario:_ Horário do racha\n\nExmplo de uso: /racha local="alguma coisa"`);

            return;
        }

        function getArgs() {
            const result = {};
            const regex = /(\w+)=["']([^"']+)["']/g;

            let match;
            while ((match = regex.exec(fullArgs)) !== null) {
                const key = match[1];
                const value = match[2];

                result[key] = value;
            }

            return result;
        }

        const args = getArgs();

        const { local, valor, titulo, horario } = args as TemplateListArgs;

        await sendReply(`\n*${titulo ?? "Racha"}*\n🏟 Local: ${local ?? "Não definido"}\n💵 Preço: ${valor ?? "Não definido"}\n⏰ Horário: ${horario ?? "Não definido"}`);
    }
}