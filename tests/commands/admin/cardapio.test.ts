// Baileys is ESM-only and can't be loaded by Jest's CommonJS runtime
jest.mock('@whiskeysockets/baileys', () => ({
    decryptPollVote: jest.fn(),
    jidNormalizedUser: (jid: string) => jid,
}));

// In-memory filesystem so menu.json is never written to disk
const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
    existsSync: (path: string) => mockFiles.has(path),
    readFileSync: (path: string) => mockFiles.get(path),
    writeFileSync: (path: string, data: string) => mockFiles.set(path, data),
    mkdirSync: jest.fn(),
}));

import { cardapio } from '../../../src/commands/admin/cardapio';
import { pedido } from '../../../src/commands/member/pedido';
import { DangerError, InvalidParameterError, WarningError } from '../../../src/errors';
import { DEFAULT_MENU_ITEMS, MAX_MENU_ITEMS, getMenuItems } from '../../../src/utils/menuManager';
import { closeOrder, createOrder, getOrder } from '../../../src/utils/pedidoManager';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

const run = async (fullArgs: string) => {
    const mock = createMockCommonFunctions({ fullArgs });
    await cardapio.handle(mock);
    return mock;
};

describe('cardapio command', () => {
    beforeEach(() => {
        mockFiles.clear();
    });

    afterEach(() => {
        closeOrder('test@g.us');
        closeOrder('other@g.us');
    });

    describe('metadata', () => {
        it('should have correct command metadata', () => {
            expect(cardapio.name).toBe('Cardápio');
            expect(cardapio.commands).toEqual(['cardapio', 'produtos']);
            expect(cardapio.usage).toContain('/cardapio adicionar');
        });
    });

    describe('list', () => {
        it('should list the default menu with prices and usage when called without action', async () => {
            const mock = await run('');

            const reply = (mock.sendReply as jest.Mock).mock.calls[0][0];
            expect(reply).toContain('1. cuscuz — R$ 7,00');
            expect(reply).toContain('7. salada G — R$ 10,00');
            expect(reply).toContain('/cardapio remover <nº>');
        });

        it('should list the menu even while an order is open', async () => {
            createOrder('other@g.us', 'user@s.whatsapp.net', 'poll1', new Uint8Array(32), [], DEFAULT_MENU_ITEMS, 60000, jest.fn());

            const mock = await run('');

            expect(mock.sendReply).toHaveBeenCalledWith(expect.stringContaining('Cardápio do pedido'));
        });

        it('should reject an unknown action', async () => {
            await expect(run('limpar')).rejects.toThrow(InvalidParameterError);
        });
    });

    describe('adicionar', () => {
        it('should add an item and persist it', async () => {
            const mock = await run('adicionar tapioca de queijo | 8,50');

            expect(getMenuItems()).toContainEqual({ name: 'tapioca de queijo', price: 850 });
            expect(mock.sendSuccessReply).toHaveBeenCalledWith(
                expect.stringContaining('Item adicionado: tapioca de queijo — R$ 8,50')
            );
        });

        it.each([
            ['7', 700],
            ['7,5', 750],
            ['7.50', 750],
            ['R$ 12,00', 1200],
        ])('should parse price "%s" as %i cents', async (price, cents) => {
            await run(`add suco | ${price}`);

            expect(getMenuItems().find((item) => item.name === 'suco')?.price).toBe(cents);
        });

        it.each(['abc', '7,555', '-3', '0'])('should reject invalid price "%s"', async (price) => {
            await expect(run(`adicionar suco | ${price}`)).rejects.toThrow(InvalidParameterError);
            expect(getMenuItems()).toEqual(DEFAULT_MENU_ITEMS);
        });

        it('should require name and price', async () => {
            await expect(run('adicionar suco')).rejects.toThrow(InvalidParameterError);
            await expect(run('adicionar | 5')).rejects.toThrow(InvalidParameterError);
        });

        it('should reject a duplicate name ignoring case', async () => {
            await expect(run('adicionar Pizza | 9')).rejects.toThrow(WarningError);
        });

        it('should reject a name longer than 100 characters', async () => {
            await expect(run(`adicionar ${'a'.repeat(101)} | 5`)).rejects.toThrow(InvalidParameterError);
        });

        it(`should not allow more than ${MAX_MENU_ITEMS} items`, async () => {
            for (let i = DEFAULT_MENU_ITEMS.length; i < MAX_MENU_ITEMS; i++) {
                await run(`adicionar item ${i} | 5`);
            }

            await expect(run('adicionar item extra | 5')).rejects.toThrow(WarningError);
            expect(getMenuItems()).toHaveLength(MAX_MENU_ITEMS);
        });
    });

    describe('editar', () => {
        it('should update name and price', async () => {
            await run('editar 2 | pão de carne grande | 7,50');

            expect(getMenuItems()[1]).toEqual({ name: 'pão de carne grande', price: 750 });
        });

        it('should keep the name when only the price is given', async () => {
            await run('editar 1 | | 8');

            expect(getMenuItems()[0]).toEqual({ name: 'cuscuz', price: 800 });
        });

        it('should keep the price when only the name is given', async () => {
            const mock = await run('atualizar 1 | cuscuz recheado');

            expect(getMenuItems()[0]).toEqual({ name: 'cuscuz recheado', price: 700 });
            expect(mock.sendSuccessReply).toHaveBeenCalledWith(expect.stringContaining('Item atualizado'));
        });

        it('should allow keeping the same name with different casing', async () => {
            await run('editar 1 | Cuscuz');

            expect(getMenuItems()[0].name).toBe('Cuscuz');
        });

        it('should reject renaming to a name used by another item', async () => {
            await expect(run('editar 1 | pizza')).rejects.toThrow(WarningError);
        });

        it.each(['0', '99', 'abc', ''])('should reject invalid position "%s"', async (position) => {
            await expect(run(`editar ${position} | novo | 5`)).rejects.toThrow(InvalidParameterError);
        });

        it('should require a new name or price', async () => {
            await expect(run('editar 1')).rejects.toThrow(InvalidParameterError);
        });
    });

    describe('remover', () => {
        it('should remove the item at the given position', async () => {
            const mock = await run('remover 1');

            expect(getMenuItems().map((item) => item.name)).not.toContain('cuscuz');
            expect(getMenuItems()).toHaveLength(DEFAULT_MENU_ITEMS.length - 1);
            expect(mock.sendSuccessReply).toHaveBeenCalledWith(expect.stringContaining('Item removido: cuscuz'));
        });

        it('should reject an invalid position', async () => {
            await expect(run('remover 42')).rejects.toThrow(InvalidParameterError);
            await expect(run('remover')).rejects.toThrow(InvalidParameterError);
        });

        it('should keep at least 2 items for the poll', async () => {
            for (let i = DEFAULT_MENU_ITEMS.length; i > 2; i--) {
                await run('remover 1');
            }

            await expect(run('del 1')).rejects.toThrow(WarningError);
            expect(getMenuItems()).toHaveLength(2);
        });
    });

    describe('open order', () => {
        it.each([
            'adicionar suco | 5',
            'editar 1 | | 8',
            'remover 1',
        ])('should block "%s" while an order is open in any group', async (args) => {
            createOrder('other@g.us', 'user@s.whatsapp.net', 'poll1', new Uint8Array(32), [], DEFAULT_MENU_ITEMS, 60000, jest.fn());

            await expect(run(args)).rejects.toThrow(WarningError);
            expect(getMenuItems()).toEqual(DEFAULT_MENU_ITEMS);
        });

        it('should allow changes again after the order is closed', async () => {
            createOrder('other@g.us', 'user@s.whatsapp.net', 'poll1', new Uint8Array(32), [], DEFAULT_MENU_ITEMS, 60000, jest.fn());
            closeOrder('other@g.us');

            await run('adicionar suco | 5');

            expect(getMenuItems()).toContainEqual({ name: 'suco', price: 500 });
        });
    });

    describe('invalid menu.json', () => {
        const writeMenuFile = (content: string) => {
            mockFiles.set(require('path').join(__dirname, '../../../assets/menu.json'), content);
        };

        it.each([
            ['malformed JSON', '{ not json'],
            ['not an array', '{"name": "cuscuz", "price": 700}'],
            ['too few items', '[{"name": "cuscuz", "price": 700}]'],
            ['invalid price', '[{"name": "a", "price": 7.5}, {"name": "b", "price": 600}]'],
            ['duplicated names', '[{"name": "a", "price": 700}, {"name": "A", "price": 600}]'],
        ])('should refuse to load a menu with %s instead of using the defaults', async (_label, content) => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            writeMenuFile(content);

            await expect(run('')).rejects.toThrow(DangerError);
            await expect(run('adicionar suco | 5')).rejects.toThrow(DangerError);
            // the user's file is left untouched
            expect(Array.from(mockFiles.values())).toEqual([content]);
        });
    });

    describe('integration with /pedido', () => {
        it('should create the poll with the configured menu', async () => {
            await run('adicionar suco | 5');
            await run('remover 1');

            const socket = {
                user: { id: 'bot@s.whatsapp.net' },
                sendMessage: jest.fn().mockResolvedValue({
                    key: { id: 'pollMenu' },
                    message: { messageContextInfo: { messageSecret: new Uint8Array(32) } },
                }),
            };
            await pedido.handle(createMockCommonFunctions({ fullArgs: '10', socket }));

            const expectedNames = [...DEFAULT_MENU_ITEMS.slice(1).map((item) => item.name), 'suco'];
            expect(socket.sendMessage.mock.calls[0][1].poll.values).toEqual(expectedNames);
            expect(getOrder('test@g.us')?.menuItems.map((item) => item.name)).toEqual(expectedNames);
        });
    });
});
