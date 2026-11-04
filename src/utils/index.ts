import readline from "readline";
import { PREFIXES, COMMANDS_DIR } from "../config";
import fs from "fs";
import path from "path";

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
        new RegExp(`^[${PREFIXES.map((prefix) => `\\${prefix}`).join("")}]+`),
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

// Fuzzy matches favor the lowest permission level, so a short input doesn't hit an admin-only command
const COMMAND_TYPE_PRIORITY = ["member", "admin", "owner"];

// Exact alias first, then alias prefix, then any substring (legacy behavior)
const COMMAND_MATCHERS = [
    (alias: string, input: string) => alias === input,
    (alias: string, input: string) => alias.startsWith(input),
    (alias: string, input: string) => alias.includes(input),
];

const findCommandImport = (commandName) => {
    const input = formatCommand(commandName);
    if (!input) {
        return { type: "", command: null };
    }

    const commandsByType = Object.entries(readCommandImports()).sort(
        ([a], [b]) => COMMAND_TYPE_PRIORITY.indexOf(a) - COMMAND_TYPE_PRIORITY.indexOf(b)
    );

    for (const matches of COMMAND_MATCHERS) {
        for (const [type, modules] of commandsByType) {
            for (const module of modules as any[]) {
                const command = Object.values(module)[0] as Command;

                if (command?.commands?.some((alias) => matches(formatCommand(alias), input))) {
                    return { type, command };
                }
            }
        }
    }

    return { type: "", command: null };
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
