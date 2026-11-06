// Fake command folders: findCommandImport reads them from COMMANDS_DIR at runtime
jest.mock('../../src/config', () => ({ ...jest.requireActual('../../src/config'), COMMANDS_DIR: '/virtual/commands' }));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readdirSync: (dir: string, options?: { withFileTypes?: boolean }) => {
    if (options?.withFileTypes) {
      return ['member', 'admin'].map((name) => ({ name, isDirectory: () => true }));
    }
    return dir.endsWith('member') ? ['poker.js', 'markAll.js'] : ['cardapio.js'];
  },
}));

const command = (name: string, aliases: string[]) => ({ [name]: { name, commands: aliases } });
jest.mock('/virtual/commands/member/poker.js', () => command('poker', ['poker']), { virtual: true });
jest.mock('/virtual/commands/member/markAll.js', () => command('markAll', ['marcar', 'todos']), { virtual: true });
jest.mock('/virtual/commands/admin/cardapio.js', () => command('cardapio', ['cardapio']), { virtual: true });

import { findCommandImport } from '../../src/utils';

describe('findCommandImport', () => {
  it.each([
    ['poker', 'poker'],
    ['ok', 'poker'],
    ['po', 'poker'],
    ['a', 'markAll'],
  ])('should match %p by alias, prefix or substring with the "/" prefix', (input, name) => {
    expect(findCommandImport(input).command?.name).toBe(name);
  });

  it.each(['poker', 'cardapio'])('should match the exact alias %p when only exact matches count', (input) => {
    expect(findCommandImport(input, true).command?.name).toBe(input);
  });

  it.each(['ok', 'po', 'a', 'e'])('should match nothing for %p when only exact matches count', (input) => {
    expect(findCommandImport(input, true)).toEqual({ type: '', command: null });
  });

  it('should return the permission level of the folder', () => {
    expect(findCommandImport('cardapio', true).type).toBe('admin');
  });
});
