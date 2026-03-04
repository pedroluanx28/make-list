import { pedido } from '../../../src/commands/member/pedido';
import { pedidoEncerrar } from '../../../src/commands/member/pedidoEncerrar';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';
import {
    MENU_ITEMS,
    getOrder,
    closeOrder,
    recordVote,
    buildSummaryMessages,
    ActiveOrder,
} from '../../../src/utils/pedidoManager';
import { PREFIX } from '../../../src/config';

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
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'poll123' } }),
            };
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
                        values: MENU_ITEMS.map((i) => i.name),
                        selectableCount: 0,
                    }),
                })
            );
            expect(mock.sendReply).toHaveBeenCalledWith(
                expect.stringContaining('30 minutos')
            );
        });

        it('should use singular "minuto" when time is 1', async () => {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'poll456' } }),
            };
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
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue(null),
            };
            const mock = createMockCommonFunctions({
                fullArgs: '10',
                socket: mockSocket,
            });

            await pedido.handle(mock);

            expect(mock.sendErrorReply).toHaveBeenCalledWith(
                expect.stringContaining('Erro ao criar')
            );
        });

        it('should reject duplicate active order in the same chat', async () => {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'pollA' } }),
            };
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

        it('should register the order in pedidoManager after creation', async () => {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'pollXYZ' } }),
            };
            const mock = createMockCommonFunctions({
                fullArgs: '20',
                socket: mockSocket,
            });

            await pedido.handle(mock);

            const order = getOrder('test@g.us');
            expect(order).toBeDefined();
            expect(order?.pollMessageId).toBe('pollXYZ');
            expect(order?.closed).toBe(false);
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
        const mockSocket = {
            sendMessage: jest.fn().mockResolvedValue({ key: { id: 'pollClose1' } }),
        };
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
    });

    describe('buildSummaryMessages', () => {
        it('should return "no votes" messages when votes map is empty', () => {
            const fakeOrder: ActiveOrder = {
                chatId: 'test@g.us',
                pollMessageId: 'p1',
                votes: new Map(),
                startTime: Date.now(),
                endTime: Date.now() + 1000,
                timeoutId: setTimeout(() => {}, 0),
                closed: false,
            };
            clearTimeout(fakeOrder.timeoutId);

            const { summary, totals, mentions } = buildSummaryMessages(fakeOrder);
            expect(summary).toContain('Nenhum voto');
            expect(totals).toContain('Nenhum pagamento');
            expect(mentions).toHaveLength(0);
        });

        it('should count votes and compute individual totals correctly', () => {
            const votes = new Map<string, Set<string>>();
            votes.set('user1@s.whatsapp.net', new Set(['cuscuz', 'pizza']));
            votes.set('user2@s.whatsapp.net', new Set(['salada G']));

            const fakeOrder: ActiveOrder = {
                chatId: 'test@g.us',
                pollMessageId: 'p2',
                votes,
                startTime: Date.now(),
                endTime: Date.now() + 1000,
                timeoutId: setTimeout(() => {}, 0),
                closed: false,
            };
            clearTimeout(fakeOrder.timeoutId);

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
        it('should not record vote for unknown poll', () => {
            recordVote('unknown-poll-id', 'user@s.whatsapp.net', []);
            // No crash expected; nothing to assert beyond no error
        });

        it('should normalize JID device suffix when recording vote', () => {
            const mockSocket = { sendMessage: jest.fn() };
            // Manually create an order to test recordVote
            const { createOrder } = require('../../../src/utils/pedidoManager');
            createOrder('chat@g.us', 'poll99', 60000, jest.fn());

            recordVote('poll99', 'user1:15@s.whatsapp.net', []);

            const order = getOrder('chat@g.us');
            expect(order?.votes.has('user1@s.whatsapp.net')).toBe(true);

            closeOrder('chat@g.us');
        });
    });
});
