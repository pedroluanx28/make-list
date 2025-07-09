import { verifyPrefix, hasTypeOrCommand } from "../middlewares";
import { checkPermission } from "../middlewares/checkPermission";
import { DangerError, InvalidParameterError, WarningError } from "../errors";
import { findCommandImport } from ".";

export const dynamicCommand = async (paramsHandler) => {
    const { commandName, prefix, sendWarningReply, sendErrorReply } = paramsHandler;

    const { type, command } = findCommandImport(commandName);

    if (!verifyPrefix(prefix) || !hasTypeOrCommand({ type, command })) {
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