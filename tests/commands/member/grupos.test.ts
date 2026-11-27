const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
  existsSync: (path: string) => mockFiles.has(path),
  readFileSync: (path: string) => mockFiles.get(path),
  writeFileSync: (path: string, data: string) => mockFiles.set(path, data),
  mkdirSync: jest.fn(),
}));

import { grupos } from '../../../src/commands/member/grupos';
import { InvalidParameterError, WarningError } from '../../../src/errors';
import { getAuthorizedGroups } from '../../../src/utils/authorizedGroups';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

const OWNER = '558592578160@s.whatsapp.net';
const OTHER = 'user@s.whatsapp.net';
const GROUP = 'group@g.us';

const run = (overrides: Partial<CommonFunctions> = {}) => {
  const mock = createMockCommonFunctions({ userJid: OWNER, remoteJid: GROUP, isGroup: true, fullArgs: '', ...overrides });
  return grupos.handle(mock).then(() => mock);
};

describe('grupos command', () => {
  beforeEach(() => {
    mockFiles.clear();
  });

  it('should answer to the grupos alias', () => {
    expect(grupos.commands).toEqual(['grupos']);
  });

  it('should refuse anyone who is not the bot operator', async () => {
    await expect(run({ userJid: OTHER, fullArgs: 'autorizar' })).rejects.toThrow(
      'Só o operador do bot pode gerenciar os grupos autorizados.'
    );
  });

  it('should list no groups when none are authorized', async () => {
    const mock = await run();

    expect(mock.sendReply).toHaveBeenCalledWith('Nenhum grupo autorizado ainda.');
  });

  it('should list the authorized groups', async () => {
    const mock = await run({ fullArgs: 'autorizar' });
    const relisted = await run({ fullArgs: '  ', userJid: OWNER, remoteJid: GROUP, ...{} });

    expect((relisted.sendReply as jest.Mock)).toHaveBeenCalledWith(`✅ *Grupos autorizados:*\n\n1. ${GROUP}`);
  });

  it('should refuse to authorize outside a group', async () => {
    await expect(run({ fullArgs: 'autorizar', isGroup: false, remoteJid: OTHER })).rejects.toThrow(WarningError);
  });

  it('should authorize the current group', async () => {
    const mock = await run({ fullArgs: 'autorizar' });

    expect(mock.sendSuccessReply).toHaveBeenCalledWith('Grupo autorizado! O bot já pode responder aqui.');
    expect(getAuthorizedGroups()).toEqual([GROUP]);
  });

  it('should say the group was already authorized', async () => {
    await run({ fullArgs: 'autorizar' });

    const mock = await run({ fullArgs: 'liberar' });

    expect(mock.sendSuccessReply).toHaveBeenCalledWith('Este grupo já estava autorizado.');
  });

  it('should refuse to deauthorize outside a group', async () => {
    await expect(run({ fullArgs: 'desautorizar', isGroup: false, remoteJid: OTHER })).rejects.toThrow(WarningError);
  });

  it('should deauthorize the current group', async () => {
    await run({ fullArgs: 'autorizar' });

    const mock = await run({ fullArgs: 'remover' });

    expect(mock.sendSuccessReply).toHaveBeenCalledWith('Autorização removida. O bot não vai mais responder aqui.');
    expect(getAuthorizedGroups()).toEqual([]);
  });

  it('should say the group was not authorized', async () => {
    const mock = await run({ fullArgs: 'desautorizar' });

    expect(mock.sendSuccessReply).toHaveBeenCalledWith('Este grupo não estava autorizado.');
  });

  it('should reject an unknown action', async () => {
    await expect(run({ fullArgs: 'xyz' })).rejects.toThrow(InvalidParameterError);
  });
});
