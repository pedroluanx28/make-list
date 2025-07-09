export const checkPermission = async ({ type, socket, userJid, remoteJid }) => {
    if (type === "member") {
        return true;
    }

    const { participants, owner } = await socket.groupMetadata(remoteJid);
    const participant = participants.find((participant) => participant.id === userJid);

    if (!participant) {
        return false;
    }

    const isOwner = owner === userJid || participant.admin === "superadmin";
    const isAdmin = participant.admin === "admin";

    if (type === "admin") {
        return isAdmin || isOwner;
    }

    if (type === "owner") {
        return isOwner;
    }

    return false;
}