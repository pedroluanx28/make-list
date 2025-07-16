import { extractDataFromMessage, baileysIs, isGroup } from ".";
import { BOT_EMOJI } from "../config";

export const loadCommonFunctions = ({ socket, webMessage }) => {
     const { remoteJid, args, commandName, fullArgs, fullMessage, isReply, prefix, replyJid, userJid } = extractDataFromMessage(webMessage);

     const sendText = async (text: string, mentions?: string[]) => {
          let optionalParams = {};

          if (mentions?.length) {
               optionalParams = { mentions };
          }

          await socket.sendMessage(remoteJid, {
               text: `${BOT_EMOJI} ${text}`,
               ...optionalParams,
               ...mentions
          });
     }

     const sendReply = async (text: string, mentions?: string[]) => {
          let optionalParams = {};

          if (mentions?.length) {
               optionalParams = { mentions };
          }

          await socket.sendMessage(
               remoteJid,
               { text: `${BOT_EMOJI} ${text}`, ...optionalParams },
               { quoted: webMessage }
          );
     }

     const sendReact = async (emoji: string) => {
          await socket.sendMessage(remoteJid, {
               react: {
                    text: emoji,
                    key: webMessage.key
               }
          })
     }


     const getGroupMetadata = async (groupJid = remoteJid) => {
          if (!groupJid.endsWith("@g.us")) {
               return null;
          }

          return await socket.groupMetadata(groupJid);
     };

     const getGroupParticipants = async (groupJid = remoteJid) => {
          if (!groupJid.endsWith("@g.us")) {
               return [] as Participant[];
          }

          const metadata = await getGroupMetadata(groupJid);
          return metadata?.participants as Participant[] || [] as Participant[];
     }

     const isAudio = baileysIs(webMessage, "audio");
     const isImage = baileysIs(webMessage, "image");
     const isVideo = baileysIs(webMessage, "video");
     const isSticker = baileysIs(webMessage, "sticker");

     const isGroup = !!remoteJid?.endsWith("@g.us");

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
          sendWarningReply,
          isGroup,
          getGroupParticipants
     } as CommonFunctions
}