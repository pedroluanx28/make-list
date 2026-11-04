import { checkPermission } from '../../src/middlewares/checkPermission';

const createSocket = () => ({
    groupMetadata: jest.fn().mockResolvedValue({
        owner: 'owner@s.whatsapp.net',
        participants: [
            { id: 'owner@s.whatsapp.net', admin: 'superadmin' },
            { id: 'admin@s.whatsapp.net', admin: 'admin' },
            { id: 'member@s.whatsapp.net', admin: null },
        ],
    }),
});

describe('checkPermission', () => {
    it('should always allow member commands', async () => {
        const socket = createSocket();

        await expect(
            checkPermission({ type: 'member', socket, userJid: 'x@s.whatsapp.net', remoteJid: 'x@s.whatsapp.net' })
        ).resolves.toBe(true);
        expect(socket.groupMetadata).not.toHaveBeenCalled();
    });

    it('should deny admin commands in private chats without fetching group metadata', async () => {
        const socket = createSocket();

        await expect(
            checkPermission({ type: 'admin', socket, userJid: 'admin@s.whatsapp.net', remoteJid: 'admin@s.whatsapp.net' })
        ).resolves.toBe(false);
        expect(socket.groupMetadata).not.toHaveBeenCalled();
    });

    it.each([
        ['admin', 'admin@s.whatsapp.net', true],
        ['admin', 'owner@s.whatsapp.net', true],
        ['admin', 'member@s.whatsapp.net', false],
        ['admin', 'stranger@s.whatsapp.net', false],
        ['owner', 'owner@s.whatsapp.net', true],
        ['owner', 'admin@s.whatsapp.net', false],
    ])('should return the right result for %s command run by %s', async (type, userJid, expected) => {
        await expect(
            checkPermission({ type, socket: createSocket(), userJid, remoteJid: 'group@g.us' })
        ).resolves.toBe(expected);
    });
});

describe('checkPermission with LID-addressed groups', () => {
    // In LID groups `id` is the LID and the phone number comes in `jid` (or the other way around, with `lid`)
    const createLidSocket = () => ({
        groupMetadata: jest.fn().mockResolvedValue({
            owner: '111@lid',
            ownerJid: 'owner@s.whatsapp.net',
            participants: [
                { id: '111@lid', jid: 'owner@s.whatsapp.net', admin: null },
                { id: '222@lid', jid: 'admin@s.whatsapp.net', admin: 'admin' },
                { id: 'admin2@s.whatsapp.net', lid: '333@lid', admin: 'admin' },
                { id: '444@lid', jid: 'member@s.whatsapp.net', admin: null },
            ],
        }),
    });

    it.each([
        ['admin', 'admin@s.whatsapp.net', true],
        ['admin', '222@lid', true],
        ['admin', '333@lid', true],
        ['admin', 'admin2@s.whatsapp.net', true],
        ['admin', 'member@s.whatsapp.net', false],
        ['admin', '444@lid', false],
        ['owner', 'owner@s.whatsapp.net', true],
        ['owner', '111@lid', true],
        ['owner', 'admin@s.whatsapp.net', false],
    ])('should return the right result for %s command run by %s', async (type, userJid, expected) => {
        await expect(
            checkPermission({ type, socket: createLidSocket(), userJid, remoteJid: 'group@g.us' })
        ).resolves.toBe(expected);
    });

    it('should not take a missing sender for the owner when the group has no owner', async () => {
        const socket = { groupMetadata: jest.fn().mockResolvedValue({ participants: [] }) };

        await expect(
            checkPermission({ type: 'owner', socket, userJid: undefined, remoteJid: 'group@g.us' })
        ).resolves.toBe(false);
    });
});
