import { extractDataFromMessage, baileysIs } from ".";
import { BOT_EMOJI } from "../config";

export const loadCommonFunctions = ({ socket, webMessage }) => {
     const { remoteJid, args, commandName, fullArgs, fullMessage, isReply, prefix, replyJid, userJid } = extractDataFromMessage(webMessage);

     const sendText = async (text: string) => {
          return await socket.sendMessage(remoteJid, {
               text: `${BOT_EMOJI} ${text}`
          });
     }

     const sendReply = async (text: string, mentions?: string[]) => {
          return await socket.sendMessage(
               remoteJid,
               { text: `${BOT_EMOJI} ${text}` },
               { quoted: webMessage },
               { mentions: mentions?.length ? mentions : [] }
          );
     }

     const sendReact = async (emoji: string) => {
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

     const sendSuccessReply = async (text: string) => {
          await sendSuccessReact();
          return await sendReply(`✅ ${text}`);
     };

     const sendErrorReply = async (text: string) => {
          await sendErrorReact();
          return await sendReply(`❌ ${text}`);
     };

     const sendWarningReply = async (text: string) => {
          await sendWarningReact();
          return await sendReply(`⚠️ ${text}`);
     };

     return {
          socket,
          remoteJid,
          userJid,
          prefix,
          commandName,
          fullMessage,
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
          sendReact,
          sendSuccessReact,
          sendWaitReact,
          sendWarningReact,
          sendErrorReact,
          sendSuccessReply,
          sendErrorReply,
          sendWarningReply
     }
} 