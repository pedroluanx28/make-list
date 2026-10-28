import { PREFIXES } from "../config";

const verifyPrefix = (prefix) => PREFIXES.includes(prefix);
const hasTypeOrCommand = ({ type, command }) => {
    return type && command;
}

export {
    verifyPrefix,
    hasTypeOrCommand
}