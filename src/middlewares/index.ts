import { PREFIX } from "../config";

const verifyPrefix = (prefix) => PREFIX === prefix;
const hasTypeOrCommand = ({ type, command }) => {
    return type && command;
}

export {
    verifyPrefix,
    hasTypeOrCommand
}