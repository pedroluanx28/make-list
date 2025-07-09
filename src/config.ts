import path from "path";

const TIMEOUT_BY_EVENT = 1000;
const PREFIX = "/";
const BOT_EMOJI = "🤖";
const BOT_NAME = "SindiBot";
const BOT_NUMBER = "";

const COMMANDS_DIR = path.resolve(__dirname, "commands");
const TEMP_DIR = path.resolve(__dirname, "../", "assets", "temp");

export {
    TIMEOUT_BY_EVENT,
    PREFIX,
    BOT_EMOJI,
    BOT_NAME,
    BOT_NUMBER,
    COMMANDS_DIR,
    TEMP_DIR
}