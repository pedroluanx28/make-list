const { extractDataFromMessage, baileysIs } = require(".")

exports.loadCommonFunctions = ({ socket, webMessage }) => {
     const {remoteJid, args, commandName, fullArgs, fullMessage, isReply, prefix, replyJid, userJid} = extractDataFromMessage(webMessage);

     const isImage = baileysIs(webMessage, "image");
} 