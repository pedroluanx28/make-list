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
        const voterJid = webMessage.key?.fromMe
            ? socket.user?.id
            : webMessage.key?.participant || webMessage.key?.remoteJid;
        const pollMessageId = pollUpdate.pollCreationMessageKey?.id;

        if (voterJid && pollMessageId && pollUpdate.vote) {
            recordVote(pollMessageId, voterJid, pollUpdate.vote);
        }
        return;
    }

    const commonFunctions = loadCommonFunctions({ socket, webMessage });

    await dynamicCommand(commonFunctions);
}
