jest.mock('../../src/utils', () => ({
  ...jest.requireActual('../../src/utils'),
  findCommandImport: jest.fn(),
}));

import { dynamicCommand } from '../../src/utils/dynamicCommand';
import { findCommandImport } from '../../src/utils';
import { DangerError, InvalidParameterError, WarningError } from '../../src/errors';
import { createMockCommonFunctions } from '../mocks/commonFunctions';

const mockFindCommandImport = findCommandImport as jest.MockedFunction<typeof findCommandImport>;

const USER = 'user@s.whatsapp.net';
const GROUP = 'test@g.us';

const createCommand = (handle: jest.Mock = jest.fn().mockResolvedValue(undefined)) =>
  ({
    name: 'test',
    description: 'Comando de teste',
    commands: ['test'],
    usage: '/test',
    handle,
  }) as Command & { handle: jest.Mock };

const createSocket = (participants: Participant[] = [], owner?: string) => ({
  groupMetadata: jest.fn().mockResolvedValue({ participants, owner }),
});

describe('dynamicCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('command resolution', () => {
    it('should look up the command by commandName', async () => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      const params = createMockCommonFunctions({ commandName: 'ping' });

      await dynamicCommand(params);

      expect(mockFindCommandImport).toHaveBeenCalledWith('ping');
    });

    it.each([
      ['!', 'a different prefix'],
      ['', 'an empty prefix'],
      [null, 'a null prefix'],
    ])('should ignore the message when the prefix is %p (%s)', async (prefix) => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      const params = createMockCommonFunctions({ prefix: prefix as any });

      const result = await dynamicCommand(params);

      expect(result).toBeUndefined();
      expect(command.handle).not.toHaveBeenCalled();
      expect(params.sendErrorReply).not.toHaveBeenCalled();
      expect(params.sendWarningReply).not.toHaveBeenCalled();
    });

    it.each(['/', '.'])('should run the command when the prefix is %p', async (prefix) => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      const params = createMockCommonFunctions({ prefix });

      await dynamicCommand(params);

      expect(command.handle).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['no command and no type', { type: '', command: null }],
      ['a type but no command', { type: 'member', command: null }],
      ['a command but no type', { type: '', command: createCommand() }],
    ])('should do nothing when the lookup returns %s', async (_label, lookup) => {
      mockFindCommandImport.mockReturnValue(lookup as any);
      const socket = createSocket();
      const params = createMockCommonFunctions({ socket });

      const result = await dynamicCommand(params);

      expect(result).toBeUndefined();
      expect(lookup.command?.handle ?? jest.fn()).not.toHaveBeenCalled();
      expect(socket.groupMetadata).not.toHaveBeenCalled();
      expect(params.sendErrorReply).not.toHaveBeenCalled();
      expect(params.sendWarningReply).not.toHaveBeenCalled();
    });
  });

  describe('permission check', () => {
    it('should run a member command without querying group metadata', async () => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      const socket = createSocket();
      const params = createMockCommonFunctions({ socket, isGroup: false, remoteJid: 'user@s.whatsapp.net' });

      await dynamicCommand(params);

      expect(socket.groupMetadata).not.toHaveBeenCalled();
      expect(command.handle).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['admin', 'admin'],
      ['admin', 'superadmin'],
      ['owner', 'superadmin'],
    ])('should run a %s command for a participant with role %s', async (type, role) => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type, command });
      const socket = createSocket([{ id: USER, admin: role } as Participant]);
      const params = createMockCommonFunctions({ socket, userJid: USER, remoteJid: GROUP });

      await dynamicCommand(params);

      expect(socket.groupMetadata).toHaveBeenCalledWith(GROUP);
      expect(command.handle).toHaveBeenCalledTimes(1);
      expect(params.sendErrorReply).not.toHaveBeenCalled();
    });

    it.each([
      ['admin', 'a regular member in a group', [{ id: USER, admin: null }], GROUP],
      ['owner', 'a group admin', [{ id: USER, admin: 'admin' }], GROUP],
      ['admin', 'a user not in the participant list', [{ id: 'other@s.whatsapp.net', admin: 'admin' }], GROUP],
      ['admin', 'a private chat', [], 'user@s.whatsapp.net'],
      ['owner', 'a private chat', [], 'user@s.whatsapp.net'],
    ])('should deny a %s command for %s', async (type, _label, participants, remoteJid) => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type, command });
      const socket = createSocket(participants as Participant[]);
      const params = createMockCommonFunctions({ socket, userJid: USER, remoteJid, isGroup: remoteJid === GROUP });

      await dynamicCommand(params);

      expect(command.handle).not.toHaveBeenCalled();
      expect(params.sendErrorReply).toHaveBeenCalledTimes(1);
      expect(params.sendErrorReply).toHaveBeenCalledWith('Você não tem permissão para executar este comando');
      expect(params.sendWarningReply).not.toHaveBeenCalled();
    });

    it('should return the result of the permission-denied reply', async () => {
      mockFindCommandImport.mockReturnValue({ type: 'admin', command: createCommand() });
      const params = createMockCommonFunctions({ remoteJid: 'user@s.whatsapp.net' });
      params.sendErrorReply = jest.fn().mockResolvedValue('denied-sent');

      await expect(dynamicCommand(params)).resolves.toBe('denied-sent');
    });

    it('should let the group owner run an owner command', async () => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'owner', command });
      const socket = createSocket([{ id: USER, admin: null } as Participant], USER);
      const params = createMockCommonFunctions({ socket, userJid: USER, remoteJid: GROUP });

      await dynamicCommand(params);

      expect(command.handle).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from the permission check without replying', async () => {
      mockFindCommandImport.mockReturnValue({ type: 'admin', command: createCommand() });
      const socket = { groupMetadata: jest.fn().mockRejectedValue(new Error('metadata failure')) };
      const params = createMockCommonFunctions({ socket, remoteJid: GROUP });

      await expect(dynamicCommand(params)).rejects.toThrow('metadata failure');
      expect(params.sendErrorReply).not.toHaveBeenCalled();
    });
  });

  describe('handler execution', () => {
    it('should call handle with all params plus the resolved type', async () => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      const params = createMockCommonFunctions({ fullArgs: 'a / b', args: ['a', 'b'] });

      const result = await dynamicCommand(params);

      expect(result).toBeUndefined();
      expect(command.handle).toHaveBeenCalledTimes(1);
      expect(command.handle).toHaveBeenCalledWith({ ...params, type: 'member' });
      expect(params.sendErrorReply).not.toHaveBeenCalled();
      expect(params.sendWarningReply).not.toHaveBeenCalled();
    });

    it('should override a type field from params with the resolved type when calling handle', async () => {
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      // The params `type` also reaches checkPermission (see next test), so the user must pass as owner.
      const socket = createSocket([{ id: USER, admin: 'superadmin' } as Participant]);
      const params = {
        ...createMockCommonFunctions({ socket, userJid: USER, remoteJid: GROUP }),
        type: 'owner',
      } as any;

      await dynamicCommand(params);

      expect(socket.groupMetadata).toHaveBeenCalledWith(GROUP);
      expect(command.handle.mock.calls[0][0].type).toBe('member');
    });

    it('should let a type field in params override the resolved type in the permission check', async () => {
      // Documents current behavior: checkPermission receives `{ type, ...paramsHandler }`,
      // so a `type` coming from params wins over the one resolved by findCommandImport.
      const command = createCommand();
      mockFindCommandImport.mockReturnValue({ type: 'admin', command });
      const socket = createSocket();
      const params = { ...createMockCommonFunctions({ socket, remoteJid: 'user@s.whatsapp.net' }), type: 'member' } as any;

      await dynamicCommand(params);

      expect(socket.groupMetadata).not.toHaveBeenCalled();
      expect(command.handle).toHaveBeenCalledWith(expect.objectContaining({ type: 'admin' }));
    });
  });

  describe('error handling', () => {
    let params: ReturnType<typeof createMockCommonFunctions>;

    const runWithError = async (error: unknown, commandName = 'test') => {
      const command = createCommand(jest.fn().mockRejectedValue(error));
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      params = createMockCommonFunctions({ commandName });
      return dynamicCommand(params);
    };

    it('should log the caught error', async () => {
      const error = new WarningError('cuidado');

      await runWithError(error);

      expect(console.log).toHaveBeenCalledWith(error);
    });

    it('should send a warning reply prefixed for InvalidParameterError', async () => {
      await runWithError(new InvalidParameterError('informe a data'));

      expect(params.sendWarningReply).toHaveBeenCalledTimes(1);
      expect(params.sendWarningReply).toHaveBeenCalledWith('Parâmetros inválidos: informe a data');
      expect(params.sendErrorReply).not.toHaveBeenCalled();
    });

    it('should send a warning reply with the raw message for WarningError', async () => {
      await runWithError(new WarningError('nenhum pedido aberto'));

      expect(params.sendWarningReply).toHaveBeenCalledTimes(1);
      expect(params.sendWarningReply).toHaveBeenCalledWith('nenhum pedido aberto');
      expect(params.sendErrorReply).not.toHaveBeenCalled();
    });

    it('should send an error reply with the raw message for DangerError', async () => {
      await runWithError(new DangerError('falha grave'));

      expect(params.sendErrorReply).toHaveBeenCalledTimes(1);
      expect(params.sendErrorReply).toHaveBeenCalledWith('falha grave');
      expect(params.sendWarningReply).not.toHaveBeenCalled();
    });

    it.each([
      ['Error', new Error('boom')],
      ['TypeError', new TypeError('boom')],
    ])('should send a generic error reply with details for a plain %s', async (_label, error) => {
      await runWithError(error, 'lembrete');

      expect(params.sendErrorReply).toHaveBeenCalledTimes(1);
      expect(params.sendErrorReply).toHaveBeenCalledWith(
        'Erro ao executar o comando: lembrete. Detalhes: boom'
      );
      expect(params.sendWarningReply).not.toHaveBeenCalled();
    });

    it('should report "undefined" details when a non-Error value is thrown', async () => {
      // Documents current behavior: thrown strings have no `.message`.
      await runWithError('string error', 'lembrete');

      expect(params.sendErrorReply).toHaveBeenCalledWith(
        'Erro ao executar o comando: lembrete. Detalhes: undefined'
      );
    });

    it('should crash inside the catch block when null is thrown', async () => {
      // Documents current behavior: `error.message` on null throws a TypeError and no reply is sent.
      await expect(runWithError(null)).rejects.toThrow(TypeError);
      expect(params.sendErrorReply).not.toHaveBeenCalled();
      expect(params.sendWarningReply).not.toHaveBeenCalled();
    });

    it.each([
      ['sendWarningReply', new WarningError('w')],
      ['sendErrorReply', new DangerError('d')],
    ])('should return the result of %s', async (fn, error) => {
      const command = createCommand(jest.fn().mockRejectedValue(error));
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      const p = createMockCommonFunctions();
      (p as any)[fn] = jest.fn().mockResolvedValue('reply-result');

      await expect(dynamicCommand(p)).resolves.toBe('reply-result');
    });

    it('should propagate a failure of the reply helper itself', async () => {
      const command = createCommand(jest.fn().mockRejectedValue(new DangerError('d')));
      mockFindCommandImport.mockReturnValue({ type: 'member', command });
      const p = createMockCommonFunctions();
      p.sendErrorReply = jest.fn().mockRejectedValue(new Error('network down'));

      await expect(dynamicCommand(p)).rejects.toThrow('network down');
    });
  });
});
