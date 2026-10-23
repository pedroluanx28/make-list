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
