import fs from "fs";
import path from "path";

const AUTHORIZED_GROUPS_FILE = path.join(__dirname, "../../assets/authorizedGroups.json");

const isValidGroupList = (groups: unknown): groups is string[] =>
    Array.isArray(groups) && groups.every((jid) => typeof jid === "string" && jid.endsWith("@g.us"));

export const getAuthorizedGroups = (): string[] => {
    if (!fs.existsSync(AUTHORIZED_GROUPS_FILE)) {
        return [];
    }

    let groups: unknown;
    try {
        groups = JSON.parse(fs.readFileSync(AUTHORIZED_GROUPS_FILE, "utf8"));
    } catch (error) {
        console.error("Erro ao carregar grupos autorizados:", error);
    }

    // An invalid file is treated as an empty list rather than crashing: fails closed (no group authorized)
    if (!isValidGroupList(groups)) {
        return [];
    }

    return groups;
};

const saveAuthorizedGroups = (groups: string[]) => {
    const dir = path.dirname(AUTHORIZED_GROUPS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(AUTHORIZED_GROUPS_FILE, JSON.stringify(groups, null, 2));
};

export const isGroupAuthorized = (remoteJid: string): boolean => getAuthorizedGroups().includes(remoteJid);

// Returns false when the group was already authorized (nothing changed)
export const authorizeGroup = (remoteJid: string): boolean => {
    const groups = getAuthorizedGroups();
    if (groups.includes(remoteJid)) {
        return false;
    }

    saveAuthorizedGroups([...groups, remoteJid]);
    return true;
};

// Returns false when the group was not authorized (nothing changed)
export const deauthorizeGroup = (remoteJid: string): boolean => {
    const groups = getAuthorizedGroups();
    if (!groups.includes(remoteJid)) {
        return false;
    }

    saveAuthorizedGroups(groups.filter((jid) => jid !== remoteJid));
    return true;
};
