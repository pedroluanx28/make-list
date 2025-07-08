const { extractDataFromMessage, baileysIs } = require(".");
const { BOT_EMOJI } = require("../config");

exports.loadCommonFunctions = ({ socket, webMessage }) => {
     const { remoteJid, args, commandName, fullArgs, fullMessage, isReply, prefix, replyJid, userJid } = extractDataFromMessage(webMessage);

     const sendText = async (text) => {
          return await socket.sendMessage(remoteJid, {
               text: `${BOT_EMOJI} ${text}`
          });
     }

     const sendReply = async (text) => {
          return await socket.sendMessage(
               remoteJid,
               { text: `${BOT_EMOJI} ${text}` },
               { quoted: webMessage }
          );
     }

     const sendReaction = async (reaction) => {
          return await socket.sendMessage(remoteJid, {
               react: {
                    text: emoji,
                    key: webMessage.key
               }
          })
     }

     const isAudio = baileysIs(webMessage, "audio");
     const isImage = baileysIs(webMessage, "image");
     const isVideo = baileysIs(webMessage, "video");
     const isSticker = baileysIs(webMessage, "sticker");


     const sendSuccessReact = async () => {
          return await sendReact("✅");
     };

     const sendWaitReact = async () => {
          return await sendReact("⏳");
     };

     const sendWarningReact = async () => {
          return await sendReact("⚠️");
     };

     const sendErrorReact = async () => {
          return await sendReact("❌");
     };

     const sendSuccessReply = async (text, mentions) => {
          await sendSuccessReact();
          return await sendReply(`✅ ${text}`, mentions);
     };

     return {
          socket,
          remoteJid,
          userJid,
          prefix,
          commandName,
          args,
          isReply,
          isAudio,
          isImage,
          isVideo,
          isSticker,
          fullArgs,
          replyJid,
          webMessage,
          sendText,
          sendReply,
          sendReaction,
          sendSuccessReact,
          sendWaitReact,
          sendWarningReact,
          sendErrorReact,
          sendSuccessReply
     }
} 