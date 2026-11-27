import { verifyPrefix, hasTypeOrCommand } from "../middlewares";
import { checkPermission } from "../middlewares/checkPermission";
import { DangerError, InvalidParameterError, WarningError } from "../errors";
import { findCommandImport, onlyNumbers } from ".";
import { isGroupAuthorized } from "./authorizedGroups";
import { BOT_NUMBER } from "../config";

export const dynamicCommand = async (paramsHandler) => {
    const { commandName, prefix, remoteJid, userJid, sendWarningReply, sendErrorReply } = paramsHandler;

    // "." also starts ordinary chat messages (".ok", ".a"), so with it only an exact alias runs a command
    const { type, command } = findCommandImport(commandName, prefix === ".");

    if (!verifyPrefix(prefix) || !hasTypeOrCommand({ type, command })) {
        return;
    }

    // The bot operator can always talk to any group (e.g. to authorize it); everyone else is gated
    const isOperator = Boolean(onlyNumbers(BOT_NUMBER)) && onlyNumbers(userJid ?? "") === onlyNumbers(BOT_NUMBER);
    if (remoteJid?.endsWith("@g.us") && !isOperator && !isGroupAuthorized(remoteJid)) {
        return;
    }

    if (!await checkPermission({ type, ...paramsHandler })) {
        return await sendErrorReply("Você não tem permissão para executar este comando");
    }

    try {
        await command.handle({ ...paramsHandler, type })
    } catch (error) {
        console.log(error);

        switch (true) {
            case error instanceof InvalidParameterError:
                return await sendWarningReply(`Parâmetros inválidos: ${error.message}`);
            case error instanceof WarningError:
                return await sendWarningReply(error.message);
            case error instanceof DangerError:
                return await sendErrorReply(error.message);
            default:
                return await sendErrorReply(`Erro ao executar o comando: ${commandName}. Detalhes: ${error.message}`);
        }
    }
}