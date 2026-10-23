import { loadCommonFunctions } from "../utils/loadCommonFunctions";
import { dynamicCommand } from "../utils/dynamicCommand";
import { recordVote } from "../utils/pedidoManager";

export const onMessagesUpsert = async ({ socket, messages }) => {
    if (!messages.length) {
        return;
    }

    // Several poll votes can arrive in the same event
    for (const message of messages) {
        const pollUpdate = message.message?.pollUpdateMessage;
        if (!pollUpdate) continue;

        const { key } = message;
        // The voter may have encrypted the vote with its PN or its LID
        const voterJids = key?.fromMe
            ? [socket.user?.id, socket.user?.lid]
            : [key?.participant || key?.remoteJid, key?.participantPn, key?.participantLid];
        const pollMessageId = pollUpdate.pollCreationMessageKey?.id;

        if (pollMessageId && pollUpdate.vote) {
            recordVote(pollMessageId, voterJids, pollUpdate.vote);
        }
    }

    const webMessage = messages[0];
    if (webMessage.message?.pollUpdateMessage) {
        return;
    }

    const commonFunctions = loadCommonFunctions({ socket, webMessage });

    await dynamicCommand(commonFunctions);
}
