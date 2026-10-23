import { createHash } from 'crypto';

// Baileys is ESM-only and can't be loaded by Jest's CommonJS runtime
jest.mock('@whiskeysockets/baileys', () => ({
    decryptPollVote: jest.fn(),
    jidNormalizedUser: (jid: string) => jid.replace(/:\d+@/, '@'),
}));
// No menu.json on disk: the menu falls back to the defaults
jest.mock('fs');

import { decryptPollVote } from '@whiskeysockets/baileys';
import { pedido } from '../../../src/commands/member/pedido';
import { pedidoEncerrar } from '../../../src/commands/member/pedidoEncerrar';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';
import { DEFAULT_MENU_ITEMS } from '../../../src/utils/menuManager';
import {
    getOrder,
    closeOrder,
    createOrder,
    recordVote,
    buildSummaryMessages,
    ActiveOrder,
} from '../../../src/utils/pedidoManager';

const mockDecryptPollVote = decryptPollVote as jest.MockedFunction<typeof decryptPollVote>;

const BOT_JID = '5511999999999@s.whatsapp.net';
const BOT_LID = '123456789@lid';
const POLL_SECRET = new Uint8Array(32).fill(7);
const ENCRYPTED_VOTE = { encPayload: new Uint8Array([1, 2, 3]), encIv: new Uint8Array([4, 5, 6]) };

const optionHash = (name: string) => createHash('sha256').update(name).digest();

// Shape of the WAMessage that Baileys' sendMessage returns for a poll sent by the bot
function createMockSocket(pollId: string | null = 'poll123') {
    const sentPoll = pollId && {
        key: { id: pollId, remoteJid: 'test@g.us', fromMe: true },
        message: { messageContextInfo: { messageSecret: POLL_SECRET } },
    };

    return {
        user: { id: '5511999999999:12@s.whatsapp.net', lid: '123456789:12@lid' },
        sendMessage: jest.fn().mockResolvedValue(sentPoll),
    };
}

function createFakeOrder(overrides: Partial<ActiveOrder> = {}): ActiveOrder {
    const order: ActiveOrder = {
        chatId: 'test@g.us',
        pollMessageId: 'p1',
        pollEncKey: POLL_SECRET,
        pollCreatorJids: [BOT_JID],
        menuItems: DEFAULT_MENU_ITEMS,
        votes: new Map(),
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        timeoutId: setTimeout(() => {}, 0),
        closed: false,
        ...overrides,
    };
    clearTimeout(order.timeoutId);

    return order;
}

// Helper to clean up any active orders between tests
function cleanupOrders() {
    // Close any open order for the test chat
    closeOrder('test@g.us');
}

describe('pedido command', () => {
    beforeEach(() => {
        cleanupOrders();
        jest.useFakeTimers();
    });

    afterEach(() => {
        cleanupOrders();
        jest.useRealTimers();
    });

    describe('metadata', () => {
        it('should have correct command metadata', () => {
            expect(pedido.name).toBe('Pedido');
            expect(pedido.commands).toEqual(['pedido', 'lidineide']);
            expect(pedido.usage).toContain('pedido');
        });
    });

    describe('time validation', () => {
        it('should send error when no time is provided', async () => {
            const mock = createMockCommonFunctions({ fullArgs: '' });
            await pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('Uso:')
            );
        });

        it('should send error when time is not a number', async () => {
            const mock = createMockCommonFunctions({ fullArgs: 'abc' });
            await pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('inválido')
            );
        });

        it('should send error when time is zero', async () => {
            const mock = createMockCommonFunctions({ fullArgs: '0' });
            await pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('inválido')
            );
        });

        it('should send error when time is negative', async () => {
            const mock = createMockCommonFunctions({ fullArgs: '-5' });
            await pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('inválido')
            );
        });

        it('should send error when time has decimal part', async () => {
            const mock = createMockCommonFunctions({ fullArgs: '1.5' });
            await pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('inválido')
            );
        });
    });

    describe('poll creation', () => {
        it('should create poll and reply on valid time', async () => {
            const mockSocket = createMockSocket('poll123');
            const mock = createMockCommonFunctions({
                fullArgs: '30',
                socket: mockSocket,
            });

            await pedido.handle(mock);

            expect(mockSocket.sendMessage).toHaveBeenCalledWith(
                'test@g.us',
                expect.objectContaining({
                    poll: expect.objectContaining({
                        name: expect.stringContaining('Pedido'),
                        values: DEFAULT_MENU_ITEMS.map((i) => i.name),
                        selectableCount: 0,
                    }),
                })
            );
            expect(mock.sendReply).toHaveBeenCalledWith(
                expect.stringContaining('30 minutos')
            );
        });

        it('should use singular "minuto" when time is 1', async () => {
            const mockSocket = createMockSocket('poll456');
            const mock = createMockCommonFunctions({
                fullArgs: '1',
                socket: mockSocket,
            });

            await pedido.handle(mock);

            expect(mock.sendReply).toHaveBeenCalledWith(
                expect.stringContaining('1 minuto')
            );
        });

        it('should send error when poll creation fails (no key returned)', async () => {
            const mockSocket = createMockSocket(null);
            const mock = createMockCommonFunctions({
                fullArgs: '10',
                socket: mockSocket,
            });

            await pedido.handle(mock);

            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('Erro ao criar')
            );
        });

        it('should send error when the poll message has no messageSecret', async () => {
            const mockSocket = createMockSocket('pollNoSecret');
            mockSocket.sendMessage.mockResolvedValue({ key: { id: 'pollNoSecret' }, message: {} });
            const mock = createMockCommonFunctions({
                fullArgs: '10',
                socket: mockSocket,
            });

            await pedido.handle(mock);

            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('Erro ao criar')
            );
            expect(getOrder('test@g.us')).toBeUndefined();
        });

        it('should reject duplicate active order in the same chat', async () => {
            const mockSocket = createMockSocket('pollA');
            const mock = createMockCommonFunctions({
                fullArgs: '10',
                socket: mockSocket,
            });

            // Create first order
            await pedido.handle(mock);
            (mock.sendReply as jest.MockedFunction<any>).mockClear();
            (mock.sendErrorReply as jest.MockedFunction<any>).mockClear();

            // Attempt duplicate
            await pedido.handle(mock);

            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('Já existe um pedido ativo')
            );
        });

        it('should register the order with the poll secret and the bot JIDs as creator', async () => {
            const mockSocket = createMockSocket('pollXYZ');
            const mock = createMockCommonFunctions({
                fullArgs: '20',
                socket: mockSocket,
            });

            await pedido.handle(mock);

            const order = getOrder('test@g.us');
            expect(order).toBeDefined();
            expect(order?.pollMessageId).toBe('pollXYZ');
            expect(order?.pollEncKey).toBe(POLL_SECRET);
            expect(order?.pollCreatorJids).toEqual([BOT_JID, BOT_LID]);
            expect(order?.closed).toBe(false);
        });

        it('should close the order and send results when the timer expires', async () => {
            const mockSocket = createMockSocket('pollTimer');
            const mock = createMockCommonFunctions({
                fullArgs: '5',
                socket: mockSocket,
            });

            await pedido.handle(mock);
            await jest.advanceTimersByTimeAsync(5 * 60 * 1000);

            expect(getOrder('test@g.us')).toBeUndefined();
            // poll creation + two result messages
            expect(mockSocket.sendMessage).toHaveBeenCalledTimes(3);
        });
    });
});

describe('pedidoEncerrar command', () => {
    beforeEach(() => {
        cleanupOrders();
        jest.useFakeTimers();
    });

    afterEach(() => {
        cleanupOrders();
        jest.useRealTimers();
    });

    describe('metadata', () => {
        it('should have correct command metadata', () => {
            expect(pedidoEncerrar.name).toBe('Encerrar Pedido');
            expect(pedidoEncerrar.commands).toEqual([
                'pedido-encerrar',
                'lidineide-encerrar',
            ]);
            expect(pedidoEncerrar.usage).toContain('pedido-encerrar');
        });
    });

    it('should send error when no active order exists', async () => {
        const mock = createMockCommonFunctions();
        await pedidoEncerrar.handle(mock);
        expect(mock.sendErrorReply).toHaveBeenCalledWith(
            expect.stringContaining('Não há pedido ativo')
        );
    });

    it('should close the order and send results when an order is active', async () => {
        // First, create an active order via the pedido command
        const mockSocket = createMockSocket('pollClose1');
        const createMock = createMockCommonFunctions({
            fullArgs: '10',
            socket: mockSocket,
        });
        await pedido.handle(createMock);

        // Now close it manually
        const closeMock = createMockCommonFunctions({ socket: mockSocket });
        await pedidoEncerrar.handle(closeMock);

        expect(closeMock.sendReply).toHaveBeenCalledWith(
            expect.stringContaining('Encerrando pedido')
        );
        // socket.sendMessage called for: poll creation + two result messages
        expect(mockSocket.sendMessage).toHaveBeenCalledTimes(3);
    });
});

describe('pedidoManager', () => {
    beforeEach(() => {
        closeOrder('test@g.us');
        closeOrder('chat@g.us');
        mockDecryptPollVote.mockReset();
    });

    describe('buildSummaryMessages', () => {
        it('should return "no votes" messages when votes map is empty', () => {
            const fakeOrder = createFakeOrder();

            const { summary, totals, mentions } = buildSummaryMessages(fakeOrder);
            expect(summary).toContain('Nenhum voto');
            expect(totals).toContain('Nenhum pagamento');
            expect(mentions).toHaveLength(0);
        });

        it('should count votes and compute individual totals correctly', () => {
            const votes = new Map<string, Set<string>>();
            votes.set('user1@s.whatsapp.net', new Set(['cuscuz', 'pizza']));
            votes.set('user2@s.whatsapp.net', new Set(['salada G']));

            const fakeOrder = createFakeOrder({ pollMessageId: 'p2', votes });

            const { summary, totals, mentions } = buildSummaryMessages(fakeOrder);

            // Summary should list voted items
            expect(summary).toContain('cuscuz: 1');
            expect(summary).toContain('pizza: 1');
            expect(summary).toContain('salada G: 1');
            // Summary should NOT contain prices
            expect(summary).not.toContain('R$');

            // user1: cuscuz R$7 + pizza R$6 = R$13
            expect(totals).toContain('R$ 13,00');
            // user2: salada G R$10
            expect(totals).toContain('R$ 10,00');

            expect(mentions).toContain('user1@s.whatsapp.net');
            expect(mentions).toContain('user2@s.whatsapp.net');
        });
    });

    describe('recordVote', () => {
        beforeEach(() => {
            createOrder('chat@g.us', 'poll99', POLL_SECRET, [BOT_JID, BOT_LID], DEFAULT_MENU_ITEMS, 60000, jest.fn());
        });

        afterEach(() => {
            closeOrder('chat@g.us');
        });

        it('should ignore votes for unknown polls', () => {
            recordVote('unknown-poll-id', 'user@s.whatsapp.net', ENCRYPTED_VOTE);

            expect(mockDecryptPollVote).not.toHaveBeenCalled();
            expect(getOrder('chat@g.us')?.votes.size).toBe(0);
        });

        it('should decrypt with the poll secret, bot JID and normalized voter JID', () => {
            mockDecryptPollVote.mockReturnValue({ selectedOptions: [] } as any);

            recordVote('poll99', 'user1:15@s.whatsapp.net', ENCRYPTED_VOTE);

            expect(mockDecryptPollVote).toHaveBeenCalledWith(ENCRYPTED_VOTE, {
                pollCreatorJid: BOT_JID,
                pollMsgId: 'poll99',
                pollEncKey: POLL_SECRET,
                voterJid: 'user1@s.whatsapp.net',
            });
            expect(getOrder('chat@g.us')?.votes.has('user1@s.whatsapp.net')).toBe(true);
        });

        it('should map decrypted option hashes to menu items', () => {
            mockDecryptPollVote.mockReturnValue({
                selectedOptions: [optionHash('cuscuz'), optionHash('pão misto'), optionHash('fora do menu')],
            } as any);

            recordVote('poll99', 'user1@s.whatsapp.net', ENCRYPTED_VOTE);

            const votes = getOrder('chat@g.us')?.votes.get('user1@s.whatsapp.net');
            expect(votes).toEqual(new Set(['cuscuz', 'pão misto']));
        });

        it('should replace the previous selection when the user votes again', () => {
            mockDecryptPollVote
                .mockReturnValueOnce({ selectedOptions: [optionHash('cuscuz')] } as any)
                .mockReturnValueOnce({ selectedOptions: [optionHash('pizza')] } as any);

            recordVote('poll99', 'user1@s.whatsapp.net', ENCRYPTED_VOTE);
            recordVote('poll99', 'user1@s.whatsapp.net', ENCRYPTED_VOTE);

            expect(getOrder('chat@g.us')?.votes.get('user1@s.whatsapp.net')).toEqual(new Set(['pizza']));
        });

        it('should fall back to the bot LID when decryption with the PN fails', () => {
            mockDecryptPollVote
                .mockImplementationOnce(() => { throw new Error('Unsupported state or unable to authenticate data'); })
                .mockReturnValueOnce({ selectedOptions: [optionHash('pizza')] } as any);

            recordVote('poll99', '987654321@lid', ENCRYPTED_VOTE);

            expect(mockDecryptPollVote).toHaveBeenLastCalledWith(
                ENCRYPTED_VOTE,
                expect.objectContaining({ pollCreatorJid: BOT_LID })
            );
            expect(getOrder('chat@g.us')?.votes.get('987654321@lid')).toEqual(new Set(['pizza']));
        });

        it('should not record the vote when it cannot be decrypted', () => {
            mockDecryptPollVote.mockImplementation(() => { throw new Error('bad decrypt'); });

            recordVote('poll99', 'user1@s.whatsapp.net', ENCRYPTED_VOTE);

            expect(mockDecryptPollVote).toHaveBeenCalledTimes(2);
            expect(getOrder('chat@g.us')?.votes.size).toBe(0);
        });
    });
});
