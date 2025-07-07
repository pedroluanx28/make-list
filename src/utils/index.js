const readline = require("readline");
const { PREFIX } = require("../config");

exports.question = (message) => {
    const readlineInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => readlineInterface.question(message, resolve));
}

exports.onlyNumbers = (string) => string.replace(/[^0-9]/g, "");

exports.extractDataFromMessage = (webMessage) => {
    const messageConversation = webMessage.message?.conversation;
    const extendedTextMessage = webMessage.message?.extendedTextMessage;
    const imageTextMessage = webMessage.message?.imageMessage?.caption;
    const videoTextMessage = webMessage.message?.videoMessage?.caption;


    const message = messageConversation || extendedTextMessage?.text || imageTextMessage || videoTextMessage;

    if (!message) {
        return {
            args: [],
            commandName: null,
            fullArgs: null,
            fullMessage: null,
            isReply: false,
            prefix: null,
            remoteJid: null,
            replyJid: null,
            userJid: null,
        };
    }

    const isReply = !!extendedTextMessage && !!extendedTextMessage.contextInfo?.quotedMessage;

    const replyJid = !!extendedTextMessage && !!extendedTextMessage.contextInfo.participant
        ? extendedTextMessage.contextInfo.participant
        : null;

    const userJid = webMessage?.key?.participant?.replace(/:[0-9][0-9]|:[0-9]/g, "");

    const [command, ...args] = message.split(" ");
    const prefix = command.charAt(0);

    const commandWithoutPrefix = command.replace(new RegExp(`^[${PREFIX}]+`));

    return {
        args: this.splitByCharacters(args.join(" "), ["\\", "|", "/"]),
        commandName: this.formatCommand(commandWithoutPrefix),
        fullArgs: args.join(" "),
        fullMessage,
        isReply,
        prefix,
        remoteJid: webMessage?.key?.remoteJid,
        replyJid,
        userJid,
    };
}

exports.splitByCharacters = (str, characters) => {
  characters = characters.map((char) => (char === "\\" ? "\\\\" : char));
  const regex = new RegExp(`[${characters.join("")}]`);

  return str
    .split(regex)
    .map((str) => str.trim())
    .filter(Boolean);
};

exports.formatCommand = (text) => {
  return this.onlyLettersAndNumbers(
    this.removeAccentsAndSpecialCharacters(text.toLocaleLowerCase().trim())
  );
};

exports.isGroup = (remoteJid) => {
  return remoteJid.endsWith("@g.us");
};

exports.onlyLettersAndNumbers = (text) => {
  return text.replace(/[^a-zA-Z0-9]/g, "");
};

exports.removeAccentsAndSpecialCharacters = (text) => {
  if (!text) return "";

  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};


exports.baileysIs = (webMessage, context) => {
  return !!this.getContent(webMessage, context);
};

exports.getContent = (webMessage, context) => {
  return (
    webMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
      `${context}Message`
    ] ||
    webMessage?.message?.viewOnceMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.viewOnceMessage?.message?.[`${context}Message`] ||
    webMessage?.message?.viewOnceMessageV2?.message?.[`${context}Message`] ||
    webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ?.viewOnceMessageV2?.message?.[`${context}Message`]
  );
};