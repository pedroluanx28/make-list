import { loadCommonFunctions } from "../utils/loadCommonFunctions";
import { dynamicCommand } from "../utils/dynamicCommand";
import { recordVote } from "../utils/pedidoManager";

export const onMessagesUpsert = async ({ socket, messages }) => {
    if (!messages.length) {
        return;
    }

    const webMessage = messages[0];

    // Handle poll vote updates
    const pollUpdate = webMessage.message?.pollUpdateMessage;
    if (pollUpdate) {
        const voterJid =
            webMessage.key?.participant || webMessage.key?.remoteJid;
        const pollMessageId = pollUpdate.pollCreationMessageKey?.id;
        const selectedOptionHashes: Uint8Array[] =
            pollUpdate.vote?.selectedOptions || [];

        if (voterJid && pollMessageId) {
            recordVote(pollMessageId, voterJid, selectedOptionHashes);
        }
        return;
    }

    const commonFunctions = loadCommonFunctions({ socket, webMessage });

    await dynamicCommand(commonFunctions);
}