import readline from "readline";
import { PREFIX, COMMANDS_DIR } from "../config";
import fs from "fs";
import path from "path";

type Command = {
    name: string,
    description: string,
    commands: string[],
    usage: string,
    handle: () => void
}

const question = (message: string) => {
    const readlineInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise<string>((resolve) =>
        readlineInterface.question(message, resolve)
    );
};

const onlyNumbers = (string: string) => string.replace(/[^0-9]/g, "");

const extractDataFromMessage = (webMessage) => {
    const messageConversation = webMessage.message?.conversation;
    const extendedTextMessage = webMessage.message?.extendedTextMessage;
    const imageTextMessage = webMessage.message?.imageMessage?.caption;
    const videoTextMessage = webMessage.message?.videoMessage?.caption;

    const message =
        messageConversation ||
        extendedTextMessage?.text ||
        imageTextMessage ||
        videoTextMessage;

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

    const isReply =
        Boolean(extendedTextMessage) &&
        Boolean(extendedTextMessage.contextInfo?.quotedMessage);

    const replyJid =
        Boolean(extendedTextMessage) &&
            Boolean(extendedTextMessage?.contextInfo?.participant)
            ? extendedTextMessage.contextInfo.participant
            : null;

    const userJid = webMessage?.key?.participant?.replace(
        /:[0-9][0-9]|:[0-9]/g,
        ""
    );

    const [command, ...args] = message.split(" ");
    const prefix = command.charAt(0);

    const commandWithoutPrefix = command.replace(
        new RegExp(`^[${PREFIX}]+`),
        ""
    );

    return {
        args: splitByCharacters(args.join(" "), ["\\", "|", "/"]),
        commandName: formatCommand(commandWithoutPrefix),
        fullArgs: args.join(" "),
        fullMessage: message,
        isReply,
        prefix,
        remoteJid: webMessage?.key?.remoteJid,
        replyJid,
        userJid,
    };
};

const splitByCharacters = (str, characters) => {
    characters = characters.map((char) => (char === "\\" ? "\\\\" : char));
    const regex = new RegExp(`[${characters.join("")}]`);

    return str
        .split(regex)
        .map((str) => str.trim())
        .filter(Boolean);
};

const formatCommand = (text: string) => {
    return onlyLettersAndNumbers(
        removeAccentsAndSpecialCharacters(text?.toLocaleLowerCase()?.trim())
    );
};

const isGroup = (remoteJid) => {
    return remoteJid.endsWith("@g.us");
};

const onlyLettersAndNumbers = (text: string) => {
    return text.replace(/[^a-zA-Z0-9]/g, "");
};

const removeAccentsAndSpecialCharacters = (text) => {
    if (!text) return "";

    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const baileysIs = (webMessage, context) => {
    return Boolean(getContent(webMessage, context));
};

const getContent = (webMessage, context) => {
    return (
        webMessage?.message?.[`${context}Message`] ||
        webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
        `${context}Message`
        ] ||
        webMessage?.message?.viewOnceMessage?.message?.[`${context}Message`] ||
        webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ?.viewOnceMessage?.message?.[`${context}Message`] ||
        webMessage?.message?.viewOnceMessageV2?.message?.[
        `${context}Message`
        ] ||
        webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ?.viewOnceMessageV2?.message?.[`${context}Message`]
    );
};

// Requer refatoração
const findCommandImport = (commandName) => {
    const command = readCommandImports();

    let typeReturn = "";
    let targetCommandReturn = null;

    for (const [type, commands] of Object.entries(command)) {
        if (!(commands as any).length) continue;
        let commandConstName = "";

        const targetCommand = (commands as any).find((cmd) => {
            const [formattedCommandName, array] = Object.entries(cmd)[0];

            commandConstName = formattedCommandName;

            return (array as Command)?.commands.find((c) => formatCommand(c).includes(formatCommand(commandName)));
        });

        if (targetCommand) {
            typeReturn = type;
            targetCommandReturn = targetCommand[commandConstName];
            break;
        }
    }

    return {
        type: typeReturn,
        command: targetCommandReturn,
    };
};

const readCommandImports = () => {
    const subDirs = fs
        .readdirSync(COMMANDS_DIR, { withFileTypes: true })
        .filter((directory) => directory.isDirectory())
        .map((directory) => directory.name);

    const commandImports = {};

    for (const subDir of subDirs) {
        const subDirPath = path.join(COMMANDS_DIR, subDir);
        const files = fs
            .readdirSync(subDirPath)
            .filter((file) => !file.startsWith("_") && file.endsWith(".js"))
            .map((file) => {
                return require(path.join(subDirPath, file));
            });

        commandImports[subDir] = files;
    }

    return commandImports;
};

export {
    question,
    onlyNumbers,
    extractDataFromMessage,
    splitByCharacters,
    formatCommand,
    isGroup,
    onlyLettersAndNumbers,
    removeAccentsAndSpecialCharacters,
    baileysIs,
    getContent,
    findCommandImport,
    readCommandImports,
};
