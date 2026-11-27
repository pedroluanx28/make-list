import { PREFIX, BOT_NUMBER } from "../../config";
import { InvalidParameterError, WarningError } from "../../errors";
import { formatCommand, onlyNumbers } from "../../utils";
import { authorizeGroup, deauthorizeGroup, getAuthorizedGroups } from "../../utils/authorizedGroups";

const USAGE = [
    `${PREFIX}grupos — lista os grupos autorizados`,
    `${PREFIX}grupos autorizar — autoriza o grupo atual`,
    `${PREFIX}grupos desautorizar — remove a autorização do grupo atual`,
].join("\n");

const AUTHORIZE_ACTIONS = ["autorizar", "liberar"];
const DEAUTHORIZE_ACTIONS = ["desautorizar", "remover"];

// Only the bot operator's own number may manage the allowlist, regardless of their role in the current group
const requireOperator = (userJid: string) => {
    if (!BOT_NUMBER || onlyNumbers(userJid) !== onlyNumbers(BOT_NUMBER)) {
        throw new WarningError("Só o operador do bot pode gerenciar os grupos autorizados.");
    }
};

export const grupos: Command = {
    name: "Grupos autorizados",
    description: "Lista, autoriza ou remove a autorização de grupos a usar o bot",
    commands: ["grupos"],
    usage: USAGE,
    handle: async ({ userJid, remoteJid, isGroup, fullArgs, sendReply, sendSuccessReply }) => {
        requireOperator(userJid);

        const action = formatCommand((fullArgs || "").trim());

        if (!action) {
            const groups = getAuthorizedGroups();
            await sendReply(
                groups.length
                    ? `✅ *Grupos autorizados:*\n\n${groups.map((jid, index) => `${index + 1}. ${jid}`).join("\n")}`
                    : "Nenhum grupo autorizado ainda."
            );
            return;
        }

        if (AUTHORIZE_ACTIONS.includes(action)) {
            if (!isGroup) {
                throw new WarningError(`${PREFIX}grupos autorizar só funciona dentro do grupo que você quer autorizar.`);
            }

            const authorized = authorizeGroup(remoteJid);
            await sendSuccessReply(authorized ? "Grupo autorizado! O bot já pode responder aqui." : "Este grupo já estava autorizado.");
            return;
        }

        if (DEAUTHORIZE_ACTIONS.includes(action)) {
            if (!isGroup) {
                throw new WarningError(`${PREFIX}grupos desautorizar só funciona dentro do grupo que você quer remover.`);
            }

            const removed = deauthorizeGroup(remoteJid);
            await sendSuccessReply(removed ? "Autorização removida. O bot não vai mais responder aqui." : "Este grupo não estava autorizado.");
            return;
        }

        throw new InvalidParameterError(`ação "${action}" desconhecida.\n\n${USAGE}`);
    },
};
