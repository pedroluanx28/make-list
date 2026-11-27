// In-memory filesystem so poker.json is never written to disk
const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
  existsSync: (path: string) => mockFiles.has(path),
  readFileSync: (path: string) => mockFiles.get(path),
  writeFileSync: (path: string, data: string) => mockFiles.set(path, data),
  mkdirSync: jest.fn(),
}));

import { pokerAction } from '../../../src/commands/member/pokerAction';
import { setActiveSocket } from '../../../src/utils/activeSocket';
import { stopClock } from '../../../src/utils/pokerClock';
import { WarningError } from '../../../src/errors';
import { addPlayer, createTable, getTable, saveTable, startHand } from '../../../src/utils/pokerManager';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

const GROUP = 'group@g.us';
const jid = (seat: number) => `55850000000${seat}@s.whatsapp.net`;

let socket: { sendMessage: jest.Mock; groupMetadata: jest.Mock };

const FILLER = ['2C', '3D', '4H', '6S', '8C', '9D', 'JH', '2S', '3C', '4D', '6H', '8S', '9C', 'JD', '2D', '3H', '4C', '6D', '8H', '9S'];

const run = async (commandName: string, args: string[] = [], seat = 0, overrides: Partial<CommonFunctions> = {}) => {
  const mock = createMockCommonFunctions({
    socket,
    remoteJid: GROUP,
    userJid: jid(seat),
    commandName,
    args,
    fullArgs: args.join(' '),
    ...overrides,
  });
  await pokerAction.handle(mock);
  return mock;
};

const seatPlayers = (buyIns: number[], minimum = 10) => {
  const table = createTable(GROUP, minimum);
  buyIns.forEach((buyIn, seat) => addPlayer(table, jid(seat), `p${seat}`, buyIn));
  saveTable(table);
  return table;
};

describe('pokerAction command', () => {
  beforeEach(() => {
    mockFiles.clear();
    socket = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      groupMetadata: jest.fn().mockResolvedValue({ participants: [], owner: undefined }),
    };
    setActiveSocket(socket);
  });

  afterEach(() => {
    stopClock(GROUP);
  });

  it('should answer to every poker action as a bare alias', () => {
    expect(pokerAction.commands).toEqual(['check', 'call', 'raise', 'fold', 'allin']);
  });

  it('should refuse outside a group', async () => {
    await expect(run('call', [], 0, { isGroup: false, remoteJid: jid(0) })).rejects.toThrow('O poker só funciona em grupos.');
  });

  it('should refuse when there is no table open', async () => {
    await expect(run('call')).rejects.toThrow(WarningError);
  });

  it('should apply the action to the current player and announce it to the group', async () => {
    const table = seatPlayers([100, 100, 100]);
    startHand(table, FILLER);
    saveTable(table);

    await run('call');

    expect(socket.sendMessage).toHaveBeenCalledWith(
      GROUP,
      expect.objectContaining({ text: expect.stringContaining('📞 p0 deu call') })
    );
    expect(getTable(GROUP)!.hand!.current).toBe(1);
  });

  it('should raise to the value given in the first argument', async () => {
    const table = seatPlayers([100, 100, 100]);
    startHand(table, FILLER);
    saveTable(table);

    await run('raise', ['0,40']);

    expect(getTable(GROUP)!.players[0].chips).toBe(60);
  });
});
