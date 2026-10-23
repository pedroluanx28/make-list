jest.mock('../../src/utils/pedidoManager', () => ({ recordVote: jest.fn() }));
jest.mock('../../src/utils/loadCommonFunctions', () => ({ loadCommonFunctions: jest.fn(() => ({})) }));
jest.mock('../../src/utils/dynamicCommand', () => ({ dynamicCommand: jest.fn() }));

import { onMessagesUpsert } from '../../src/middlewares/onMessagesUpsert';
import { recordVote } from '../../src/utils/pedidoManager';
import { dynamicCommand } from '../../src/utils/dynamicCommand';

const socket = { user: { id: 'bot:12@s.whatsapp.net', lid: 'botlid:12@lid' } };
const VOTE = { encPayload: new Uint8Array([1]), encIv: new Uint8Array([2]) };

const pollVote = (key: object) => ({
    key: { remoteJid: 'test@g.us', ...key },
    message: { pollUpdateMessage: { pollCreationMessageKey: { id: 'poll1' }, vote: VOTE } },
});

describe('onMessagesUpsert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should record every poll vote in the event, not only the first', async () => {
        await onMessagesUpsert({
            socket,
            messages: [
                pollVote({ participant: 'a@s.whatsapp.net' }),
                pollVote({ participant: 'b@s.whatsapp.net' }),
            ],
        });

        expect(recordVote).toHaveBeenCalledTimes(2);
        expect(recordVote).toHaveBeenLastCalledWith('poll1', expect.arrayContaining(['b@s.whatsapp.net']), VOTE);
        expect(dynamicCommand).not.toHaveBeenCalled();
    });

    it('should pass the voter PN and LID so either can decrypt the vote', async () => {
        await onMessagesUpsert({
            socket,
            messages: [pollVote({ participant: '111@lid', participantPn: '5511@s.whatsapp.net', participantLid: '111@lid' })],
        });

        expect(recordVote).toHaveBeenCalledWith('poll1', ['111@lid', '5511@s.whatsapp.net', '111@lid'], VOTE);
    });

    it('should use both bot JIDs for the bot own votes', async () => {
        await onMessagesUpsert({ socket, messages: [pollVote({ fromMe: true })] });

        expect(recordVote).toHaveBeenCalledWith('poll1', [socket.user.id, socket.user.lid], VOTE);
    });

    it('should handle regular messages as commands', async () => {
        await onMessagesUpsert({
            socket,
            messages: [{ key: { remoteJid: 'test@g.us' }, message: { conversation: '/ping' } }],
        });

        expect(recordVote).not.toHaveBeenCalled();
        expect(dynamicCommand).toHaveBeenCalled();
    });
});
