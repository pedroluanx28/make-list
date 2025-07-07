exports.onMessagesUpsert = async ({socket, messages}) => {
    if(!messages.length) {
        return;
    }

    const webMessage = messages[0];
    const commonFunctions = loadCommonFunctions({ socket, webMessage });

    await dynamicCommand(commonFunctions);
}