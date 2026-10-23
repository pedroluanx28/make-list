"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pedido_1 = require("../../../src/commands/member/pedido");
const pedidoEncerrar_1 = require("../../../src/commands/member/pedidoEncerrar");
const commonFunctions_1 = require("../../mocks/commonFunctions");
const pedidoManager_1 = require("../../../src/utils/pedidoManager");
// Helper to clean up any active orders between tests
function cleanupOrders() {
    // Close any open order for the test chat
    (0, pedidoManager_1.closeOrder)('test@g.us');
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
            expect(pedido_1.pedido.name).toBe('Pedido');
            expect(pedido_1.pedido.commands).toEqual(['pedido', 'lidineide']);
            expect(pedido_1.pedido.usage).toContain('pedido');
        });
    });
    describe('time validation', () => {
        it('should send error when no time is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({ fullArgs: '' });
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('Uso:'));
        }));
        it('should send error when time is not a number', () => __awaiter(void 0, void 0, void 0, function* () {
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({ fullArgs: 'abc' });
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('inválido'));
        }));
        it('should send error when time is zero', () => __awaiter(void 0, void 0, void 0, function* () {
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({ fullArgs: '0' });
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('inválido'));
        }));
        it('should send error when time is negative', () => __awaiter(void 0, void 0, void 0, function* () {
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({ fullArgs: '-5' });
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('inválido'));
        }));
        it('should send error when time has decimal part', () => __awaiter(void 0, void 0, void 0, function* () {
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({ fullArgs: '1.5' });
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('inválido'));
        }));
    });
    describe('poll creation', () => {
        it('should create poll and reply on valid time', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'poll123' } }),
            };
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({
                fullArgs: '30',
                socket: mockSocket,
            });
            yield pedido_1.pedido.handle(mock);
            expect(mockSocket.sendMessage).toHaveBeenCalledWith('test@g.us', expect.objectContaining({
                poll: expect.objectContaining({
                    name: expect.stringContaining('Pedido'),
                    values: pedidoManager_1.MENU_ITEMS.map((i) => i.name),
                    selectableCount: 0,
                }),
            }));
            expect(mock.sendReply).toHaveBeenCalledWith(expect.stringContaining('30 minutos'));
        }));
        it('should use singular "minuto" when time is 1', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'poll456' } }),
            };
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({
                fullArgs: '1',
                socket: mockSocket,
            });
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendReply).toHaveBeenCalledWith(expect.stringContaining('1 minuto'));
        }));
        it('should send error when poll creation fails (no key returned)', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue(null),
            };
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({
                fullArgs: '10',
                socket: mockSocket,
            });
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('Erro ao criar'));
        }));
        it('should reject duplicate active order in the same chat', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'pollA' } }),
            };
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({
                fullArgs: '10',
                socket: mockSocket,
            });
            // Create first order
            yield pedido_1.pedido.handle(mock);
            mock.sendReply.mockClear();
            mock.sendErrorReply.mockClear();
            // Attempt duplicate
            yield pedido_1.pedido.handle(mock);
            expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('Já existe um pedido ativo'));
        }));
        it('should register the order in pedidoManager after creation', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSocket = {
                sendMessage: jest.fn().mockResolvedValue({ key: { id: 'pollXYZ' } }),
            };
            const mock = (0, commonFunctions_1.createMockCommonFunctions)({
                fullArgs: '20',
                socket: mockSocket,
            });
            yield pedido_1.pedido.handle(mock);
            const order = (0, pedidoManager_1.getOrder)('test@g.us');
            expect(order).toBeDefined();
            expect(order === null || order === void 0 ? void 0 : order.pollMessageId).toBe('pollXYZ');
            expect(order === null || order === void 0 ? void 0 : order.closed).toBe(false);
        }));
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
            expect(pedidoEncerrar_1.pedidoEncerrar.name).toBe('Encerrar Pedido');
            expect(pedidoEncerrar_1.pedidoEncerrar.commands).toEqual([
                'pedido-encerrar',
                'lidineide-encerrar',
            ]);
            expect(pedidoEncerrar_1.pedidoEncerrar.usage).toContain('pedido-encerrar');
        });
    });
    it('should send error when no active order exists', () => __awaiter(void 0, void 0, void 0, function* () {
        const mock = (0, commonFunctions_1.createMockCommonFunctions)();
        yield pedidoEncerrar_1.pedidoEncerrar.handle(mock);
        expect(mock.sendErrorReply).toHaveBeenCalledWith(expect.stringContaining('Não há pedido ativo'));
    }));
    it('should close the order and send results when an order is active', () => __awaiter(void 0, void 0, void 0, function* () {
        // First, create an active order via the pedido command
        const mockSocket = {
            sendMessage: jest.fn().mockResolvedValue({ key: { id: 'pollClose1' } }),
        };
        const createMock = (0, commonFunctions_1.createMockCommonFunctions)({
            fullArgs: '10',
            socket: mockSocket,
        });
        yield pedido_1.pedido.handle(createMock);
        // Now close it manually
        const closeMock = (0, commonFunctions_1.createMockCommonFunctions)({ socket: mockSocket });
        yield pedidoEncerrar_1.pedidoEncerrar.handle(closeMock);
        expect(closeMock.sendReply).toHaveBeenCalledWith(expect.stringContaining('Encerrando pedido'));
        // socket.sendMessage called for: poll creation + two result messages
        expect(mockSocket.sendMessage).toHaveBeenCalledTimes(3);
    }));
});
describe('pedidoManager', () => {
    beforeEach(() => {
        (0, pedidoManager_1.closeOrder)('test@g.us');
    });
    describe('buildSummaryMessages', () => {
        it('should return "no votes" messages when votes map is empty', () => {
            const fakeOrder = {
                chatId: 'test@g.us',
                pollMessageId: 'p1',
                votes: new Map(),
                startTime: Date.now(),
                endTime: Date.now() + 1000,
                timeoutId: setTimeout(() => { }, 0),
                closed: false,
            };
            clearTimeout(fakeOrder.timeoutId);
            const { summary, totals, mentions } = (0, pedidoManager_1.buildSummaryMessages)(fakeOrder);
            expect(summary).toContain('Nenhum voto');
            expect(totals).toContain('Nenhum pagamento');
            expect(mentions).toHaveLength(0);
        });
        it('should count votes and compute individual totals correctly', () => {
            const votes = new Map();
            votes.set('user1@s.whatsapp.net', new Set(['cuscuz', 'pizza']));
            votes.set('user2@s.whatsapp.net', new Set(['salada G']));
            const fakeOrder = {
                chatId: 'test@g.us',
                pollMessageId: 'p2',
                votes,
                startTime: Date.now(),
                endTime: Date.now() + 1000,
                timeoutId: setTimeout(() => { }, 0),
                closed: false,
            };
            clearTimeout(fakeOrder.timeoutId);
            const { summary, totals, mentions } = (0, pedidoManager_1.buildSummaryMessages)(fakeOrder);
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
            (0, pedidoManager_1.recordVote)('unknown-poll-id', 'user@s.whatsapp.net', []);
            // No crash expected; nothing to assert beyond no error
        });
        it('should normalize JID device suffix when recording vote', () => {
            const mockSocket = { sendMessage: jest.fn() };
            // Manually create an order to test recordVote
            const { createOrder } = require('../../../src/utils/pedidoManager');
            createOrder('chat@g.us', 'poll99', 60000, jest.fn());
            (0, pedidoManager_1.recordVote)('poll99', 'user1:15@s.whatsapp.net', []);
            const order = (0, pedidoManager_1.getOrder)('chat@g.us');
            expect(order === null || order === void 0 ? void 0 : order.votes.has('user1@s.whatsapp.net')).toBe(true);
            (0, pedidoManager_1.closeOrder)('chat@g.us');
        });
    });
});
//# sourceMappingURL=pedido.test.js.map