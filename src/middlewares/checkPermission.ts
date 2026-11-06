// The sender may come as a phone number JID or as a LID; group metadata can list either form
export const getGroupRole = async (socket, groupJid: string, userJid: string) => {
    const { participants, owner, ownerJid } = await socket.groupMetadata(groupJid);
    const participant = participants.find((participant) =>
        [participant.id, participant.lid, participant.jid].includes(userJid)
    );

    if (userJid && ([owner, ownerJid].includes(userJid) || participant?.admin === "superadmin")) {
        return "owner";
    }

    if (participant?.admin === "admin") {
        return "admin";
    }

    return participant ? "member" : null;
};

export const isGroupAdmin = async (socket, groupJid: string, userJid: string) =>
    ["owner", "admin"].includes(await getGroupRole(socket, groupJid, userJid));

export const checkPermission = async ({ type, socket, userJid, remoteJid }) => {
    if (type === "member") {
        return true;
    }

    // Admin/owner roles only exist in groups; groupMetadata throws for private chats
    if (!remoteJid?.endsWith("@g.us")) {
        return false;
    }

    const role = await getGroupRole(socket, remoteJid, userJid);

    if (type === "admin") {
        return role === "admin" || role === "owner";
    }

    if (type === "owner") {
        return role === "owner";
    }

    return false;
}
