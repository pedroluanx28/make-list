import { loadCommonFunctions } from "../utils/loadCommonFunctions";
import { dynamicCommand } from "../utils/dynamicCommand";

export const onMessagesUpsert = async ({ socket, messages }) => {
    if (!messages.length) {
        return;
    }

    const webMessage = messages[0];
    const commonFunctions = loadCommonFunctions({ socket, webMessage });

    await dynamicCommand(commonFunctions);
}