import { showCommands } from '../../../src/commands/member/showCommands';
import { readCommandImports } from '../../../src/utils';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

jest.mock('../../../src/utils', () => ({
  readCommandImports: jest.fn(),
}));

const mockReadCommandImports = readCommandImports as jest.MockedFunction<typeof readCommandImports>;

const GROUP = 'grupo@g.us';
const USER = 'user@s.whatsapp.net';

const moduleOf = (command: Partial<Command>) => ({ command: { commands: [], handle: jest.fn(), ...command } });

const COMMANDS = {
  member: [
    moduleOf({ usage: '/ping', description: 'Verificar conexão com o bot' }),
    moduleOf({ usage: '/pedido <tempo>\nExemplo: /pedido 30', description: 'Criar um pedido' }),
  ],
  admin: [moduleOf({ usage: '/cardapio — lista os itens\n/cardapio remover <nº>', description: 'Editar o cardápio' })],
  owner: [moduleOf({ usage: '/desligar' })],
};

const HEADER = '📋 *Comandos disponíveis*';
const MEMBERS = '*Membros*\n• /ping — Verificar conexão com o bot\n• /pedido <tempo> — Criar um pedido';
const ADMINS = '*Admins*\n• /cardapio — Editar o cardápio';
const OWNER = '*Dono*\n• /desligar';

const socketWithRole = (admin: string | null, owner = 'outro@s.whatsapp.net') => ({
  groupMetadata: jest.fn().mockResolvedValue({ owner, participants: [{ id: USER, admin }] }),
});

const run = async (overrides: Partial<CommonFunctions>) => {
  const mockFunctions = createMockCommonFunctions({ userJid: USER, remoteJid: GROUP, ...overrides });
  await showCommands.handle(mockFunctions);
  expect(mockFunctions.sendReply).toHaveBeenCalledTimes(1);
  return mockFunctions.sendReply.mock.calls[0][0];
};

describe('showCommands command', () => {
  beforeEach(() => {
    mockReadCommandImports.mockReturnValue(COMMANDS);
  });

  it('should have correct command metadata', () => {
    expect(showCommands.name).toBe('Comandos');
    expect(showCommands.description).toBe('Listar os comandos que você pode usar');
    expect(showCommands.commands).toEqual(['comandos', 'ajuda', 'help']);
    expect(showCommands.usage).toBe('/comandos');
  });

  it('should list only member commands for a regular group member', async () => {
    const message = await run({ socket: socketWithRole(null) });

    expect(message).toBe(`${HEADER}\n\n${MEMBERS}`);
  });

  it('should add the admin section for a group admin', async () => {
    const message = await run({ socket: socketWithRole('admin') });

    expect(message).toBe(`${HEADER}\n\n${MEMBERS}\n\n${ADMINS}`);
  });

  it('should add admin and owner sections for the group owner', async () => {
    const message = await run({ socket: socketWithRole(null, USER) });

    expect(message).toBe(`${HEADER}\n\n${MEMBERS}\n\n${ADMINS}\n\n${OWNER}`);
  });

  it('should treat a superadmin as owner', async () => {
    const message = await run({ socket: socketWithRole('superadmin') });

    expect(message).toBe(`${HEADER}\n\n${MEMBERS}\n\n${ADMINS}\n\n${OWNER}`);
  });

  it('should list only member commands outside a group', async () => {
    const socket = socketWithRole('admin');
    const message = await run({ socket, remoteJid: USER });

    expect(message).toBe(`${HEADER}\n\n${MEMBERS}`);
    expect(socket.groupMetadata).not.toHaveBeenCalled();
  });

  it('should omit sections whose folder has no commands', async () => {
    mockReadCommandImports.mockReturnValue({ member: COMMANDS.member, admin: [] });

    const message = await run({ socket: socketWithRole(null, USER) });

    expect(message).toBe(`${HEADER}\n\n${MEMBERS}`);
  });

  it('should propagate group metadata errors', async () => {
    const socket = { groupMetadata: jest.fn().mockRejectedValue(new Error('falhou')) };
    const mockFunctions = createMockCommonFunctions({ userJid: USER, remoteJid: GROUP, socket });

    await expect(showCommands.handle(mockFunctions)).rejects.toThrow('falhou');
    expect(mockFunctions.sendReply).not.toHaveBeenCalled();
  });
});
