// In-memory filesystem so poker.json is never written to disk
const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
  existsSync: (path: string) => mockFiles.has(path),
  readFileSync: (path: string) => mockFiles.get(path),
  writeFileSync: (path: string, data: string) => mockFiles.set(path, data),
  mkdirSync: jest.fn(),
}));

import { poker } from '../../../src/commands/member/poker';
import { DangerError, InvalidParameterError, WarningError } from '../../../src/errors';
import { addPlayer, createTable, getTable, saveTable } from '../../../src/utils/pokerManager';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

const GROUP = 'group@g.us';
const jid = (seat: number) => `55850000000${seat}@s.whatsapp.net`;
const tag = (seat: number) => `@55850000000${seat}`;

const FILLER = ['2C', '3D', '4H', '6S', '8C', '9D', 'JH', '2S', '3C', '4D', '6H', '8S', '9C', 'JD', '2D', '3H', '4C', '6D', '8H', '9S'];

// Cards the mocked Deck of Cards API hands out, in order
let deck: string[] = [];
const mockFetch = jest.fn(async (url: string) => {
  const count = Number(url.split('count=')[1]);
  const cards = deck.splice(0, count);
  return { json: async () => ({ success: true, cards: cards.map((code) => ({ code })) }) };
});

let socket: { sendMessage: jest.Mock; groupMetadata: jest.Mock };

const run = async (fullArgs: string, seat = 0, overrides: Partial<CommonFunctions> = {}) => {
  const mock = createMockCommonFunctions({ socket, remoteJid: GROUP, userJid: jid(seat), fullArgs, ...overrides });
  await poker.handle(mock);
  return mock;
};

const seatPlayers = (buyIns: number[], minimum = 10) => {
  const table = createTable(GROUP, minimum);
  buyIns.forEach((buyIn, seat) => addPlayer(table, jid(seat), `p${seat}`, buyIn));
  saveTable(table);
  return table;
};

const groupTexts = () =>
  socket.sendMessage.mock.calls.filter(([to, content]) => to === GROUP && content.text).map(([, content]) => content.text);

const lastGroupMessage = () => socket.sendMessage.mock.calls.filter(([to]) => to === GROUP).pop()![1];

describe('poker command', () => {
  beforeAll(() => {
    global.fetch = mockFetch as any;
  });

  beforeEach(() => {
    mockFiles.clear();
    deck = [...FILLER];
    mockFetch.mockClear();
    socket = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      groupMetadata: jest.fn().mockResolvedValue({ participants: [], owner: undefined }),
    };
  });

  describe('metadata', () => {
    it('should answer to the poker alias with a usage whose first line works in /comandos', () => {
      expect(poker.commands).toEqual(['poker']);
      expect(poker.usage.split('\n')[0]).toBe('.poker <subcomando> — use .poker ajuda para ver todos');
    });
  });

  describe('ajuda', () => {
    it.each(['', 'ajuda', '  AJUDA  '])('should reply with the help text for %p', async (args) => {
      const mock = await run(args);

      const reply = (mock.sendReply as jest.Mock).mock.calls[0][0];
      expect(reply).toContain('🃏 *Poker (Texas Hold\'em)*');
      expect(reply).toContain('.poker abrir [mínimo]');
      expect(reply).toContain('.poker check → passar a vez sem apostar');
      expect(reply).toContain('.poker allin → apostar todas as suas fichas');
    });

    it('should show the help when the message has no arguments at all', async () => {
      const mock = await run(null as any);

      expect((mock.sendReply as jest.Mock).mock.calls[0][0]).toContain('Poker (Texas Hold\'em)');
    });

    it('should show the help in a private chat too', async () => {
      const mock = await run('ajuda', 0, { isGroup: false, remoteJid: jid(0) });

      expect(mock.sendReply).toHaveBeenCalledTimes(1);
    });
  });

  it('should refuse any other subcommand in a private chat', async () => {
    await expect(run('abrir', 0, { isGroup: false, remoteJid: jid(0) })).rejects.toThrow('O poker só funciona em grupos.');
  });

  it('should point to the help for an unknown subcommand', async () => {
    await expect(run('xyz')).rejects.toThrow('Subcomando "xyz" não existe. Use .poker ajuda.');
  });

  describe('abrir', () => {
    it('should open a table with the default 0.10 minimum', async () => {
      const mock = await run('abrir');

      const reply = (mock.sendReply as jest.Mock).mock.calls[0][0];
      expect(reply).toContain('Mesa de poker aberta!');
      expect(reply).toContain('Blinds: small R$ 0,05 · big R$ 0,10');
      expect(getTable(GROUP)!.minimum).toBe(10);
    });

    it('should open a table with the minimum given', async () => {
      await run('abrir 0,50');

      expect(getTable(GROUP)!.minimum).toBe(50);
    });

    it('should refuse a second table in the same group', async () => {
      await run('abrir');

      await expect(run('abrir')).rejects.toThrow(WarningError);
    });

    it('should refuse an invalid minimum', async () => {
      await expect(run('abrir abc')).rejects.toThrow(InvalidParameterError);
      expect(getTable(GROUP)).toBeNull();
    });
  });

  describe('entrar', () => {
    it('should refuse when there is no table', async () => {
      await expect(run('entrar Pedro 50')).rejects.toThrow('Não há mesa aberta neste grupo. Use .poker abrir.');
    });

    it.each(['entrar', 'entrar Pedro', 'entrar Pedro Silva 50'])('should explain the usage for %p', async (args) => {
      await run('abrir');

      await expect(run(args)).rejects.toThrow(InvalidParameterError);
    });

    it('should seat the player and list everyone in seat order', async () => {
      await run('abrir');
      await run('entrar Ana 10', 0);

      const mock = await run('entrar Bia 50', 1);

      const reply = (mock.sendReply as jest.Mock).mock.calls[0][0];
      expect(reply).toBe('✅ Bia entrou na mesa com R$ 50,00.\n\n*Jogadores:*\n1. Ana (R$ 10,00)\n2. Bia (R$ 50,00)');
      expect(getTable(GROUP)!.players.map((player) => player.jid)).toEqual([jid(0), jid(1)]);
    });
  });

  describe('iniciar', () => {
    it('should refuse someone who is neither at the table nor an admin', async () => {
      seatPlayers([100, 100]);

      await expect(run('iniciar', 9)).rejects.toThrow('Só quem está na mesa ou um admin do grupo pode iniciar a mesa.');
    });

    it.each([
      ['admin', { participants: [{ id: jid(9), admin: 'admin' }] }],
      ['superadmin', { participants: [{ id: jid(9), admin: 'superadmin' }] }],
      ['owner', { participants: [], owner: jid(9) }],
      ['owner listed by phone number', { participants: [], owner: '123@lid', ownerJid: jid(9) }],
      ['admin listed by LID with the phone number in jid', { participants: [{ id: '123@lid', jid: jid(9), admin: 'admin' }] }],
      ['admin listed by phone number with the LID in lid', { participants: [{ id: '55@s.whatsapp.net', lid: jid(9), admin: 'admin' }] }],
    ])('should let a group %s start the table', async (_label, metadata) => {
      seatPlayers([100, 100]);
      socket.groupMetadata.mockResolvedValue(metadata);

      await run('iniciar', 9);

      expect(getTable(GROUP)!.hand).not.toBeNull();
    });

    it('should refuse to start with fewer than two players', async () => {
      seatPlayers([100]);

      await expect(run('iniciar')).rejects.toThrow('São necessários pelo menos 2 jogadores para iniciar.');
    });

    it('should refuse to start while a hand is in progress', async () => {
      seatPlayers([100, 100]);
      await run('iniciar');

      await expect(run('iniciar')).rejects.toThrow('Já tem uma mão em andamento.');
    });

    it('should not start the hand when the deck API fails', async () => {
      seatPlayers([100, 100]);
      deck = [];

      await expect(run('iniciar')).rejects.toThrow(DangerError);
      await expect(run('iniciar')).rejects.toThrow(/Use \.poker iniciar para tentar de novo\./);
      const table = getTable(GROUP)!;
      expect(table.started).toBe(false);
      expect(table.players.map((player) => player.chips)).toEqual([100, 100]);
    });

    it('should announce the deal, send each player their cards in private and then who starts', async () => {
      seatPlayers([100, 100, 100]);

      await run('iniciar');

      const calls = socket.sendMessage.mock.calls;
      expect(calls[0]).toEqual([GROUP, { text: '🤖 🃏 Distribuindo cartas...', mentions: [] }]);
      // Two card images then the text, for each player in seat order
      expect(calls[1]).toEqual([jid(0), { image: { url: 'https://deckofcardsapi.com/static/img/2C.png' } }]);
      expect(calls[2]).toEqual([jid(0), { image: { url: 'https://deckofcardsapi.com/static/img/3D.png' } }]);
      expect(calls[3]).toEqual([jid(0), { text: '🤖 🃏 Suas cartas na mão 1: [2♣️] [3♦️]' }]);
      expect(calls[6]).toEqual([jid(1), { text: '🤖 🃏 Suas cartas na mão 1: [4♥️] [6♠️]' }]);
      expect(calls[9]).toEqual([jid(2), { text: '🤖 🃏 Suas cartas na mão 1: [8♣️] [9♦️]' }]);
      expect(calls[10]).toEqual([
        GROUP,
        {
          text: [
            '🤖 Mesa iniciada!',
            'Small blind: p1 (R$ 0,05) · Big blind: p2 (R$ 0,10)',
            '',
            `${tag(0)} começa!`,
            '.poker call → pagar R$ 0,10',
            '.poker raise [valor] → aumentar a aposta para [valor] (padrão: o dobro, R$ 0,20; mínimo R$ 0,20)',
            '.poker fold → desistir da mão',
            '.poker allin → apostar todas as suas fichas (R$ 1,00)',
            '',
            'Pote: R$ 0,15',
          ].join('\n'),
          mentions: [jid(0)],
        },
      ]);
      expect(calls).toHaveLength(11);
    });

    it('should send only the text when a card image fails', async () => {
      seatPlayers([100, 100]);
      socket.sendMessage.mockImplementation(async (_to, content) => {
        if (content.image) throw new Error('media upload failed');
      });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await run('iniciar');

      expect(socket.sendMessage).toHaveBeenCalledWith(jid(0), { text: '🤖 🃏 Suas cartas na mão 1: [2♣️] [3♦️]' });
      expect(groupTexts().some((text) => text.includes('Não consegui mandar'))).toBe(false);
      errorSpy.mockRestore();
    });

    it('should warn the group when a player cannot receive the cards in private', async () => {
      seatPlayers([100, 100]);
      socket.sendMessage.mockImplementation(async (to, content) => {
        if (to === jid(1) && content.text) throw new Error('not on whatsapp');
      });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await run('iniciar');

      expect(socket.sendMessage).toHaveBeenCalledWith(GROUP, {
        text: `🤖 ⚠️ Não consegui mandar as cartas no privado de ${tag(1)}.`,
        mentions: [jid(1)],
      });
      errorSpy.mockRestore();
    });
  });

  describe('actions', () => {
    it('should refuse an action when there is no table', async () => {
      await expect(run('call')).rejects.toThrow(WarningError);
    });

    it('should refuse an action out of turn', async () => {
      seatPlayers([100, 100, 100]);
      await run('iniciar');

      await expect(run('call', 1)).rejects.toThrow('Não é sua vez. Agora é a vez de p0.');
    });

    it('should announce the action and tag the next player with their options', async () => {
      seatPlayers([100, 100, 100]);
      await run('iniciar');

      await run('call', 0);

      const { text, mentions } = lastGroupMessage();
      expect(text).toBe(
        [
          '🤖 📞 p0 deu call (R$ 0,10 na rodada).',
          '',
          `${tag(1)}, é sua vez!`,
          '.poker call → pagar R$ 0,05',
          '.poker raise [valor] → aumentar a aposta para [valor] (padrão: o dobro, R$ 0,20; mínimo R$ 0,20)',
          '.poker fold → desistir da mão',
          '.poker allin → apostar todas as suas fichas (R$ 1,00)',
          '',
          'Pote: R$ 0,25',
        ].join('\n')
      );
      expect(mentions).toEqual([jid(1)]);
    });

    it('should raise to the value given', async () => {
      seatPlayers([100, 100, 100]);
      await run('iniciar');

      await run('RAISE 0,40', 0);

      expect(lastGroupMessage().text).toContain('⬆️ p0 aumentou para R$ 0,40.');
      expect(getTable(GROUP)!.players[0].chips).toBe(60);
    });

    it('should refuse an invalid raise value', async () => {
      seatPlayers([100, 100, 100]);
      await run('iniciar');

      await expect(run('raise muito', 0)).rejects.toThrow(InvalidParameterError);
    });

    it('should show the flop and check actions', async () => {
      seatPlayers([100, 100, 100]);
      await run('iniciar');
      await run('call', 0);
      await run('call', 1);

      await run('check', 2);

      expect(lastGroupMessage().text).toContain('✔️ p2 deu check.\n\n🃏 *Flop:* [JH] [2♠️] [3♣️]'.replace('[JH]', '[J♥️]'));
      expect(lastGroupMessage().text).toContain(`${tag(1)}, é sua vez!\n.poker check → passar a vez sem apostar`);
    });

    it('should give the pot on folds, show the chips and deal the next hand', async () => {
      seatPlayers([100, 100, 100]);
      deck = [...FILLER, ...FILLER]; // the next hand is dealt right away
      await run('iniciar');
      await run('fold', 0);

      await run('fold', 1);

      const texts = groupTexts();
      const result = texts[texts.length - 3];
      expect(result).toBe(
        [
          '🤖 🏳️ p1 desistiu da mão.',
          '',
          `🏆 ${tag(2)} levou o pote de R$ 0,15.`,
          '',
          'Fichas: p0 R$ 1,00 · p1 R$ 0,95 · p2 R$ 1,05',
        ].join('\n')
      );
      expect(texts[texts.length - 2]).toBe('🤖 🃏 Distribuindo cartas...');
      expect(texts[texts.length - 1]).toMatch(/^🤖 Mão 2 iniciada!\nSmall blind: p2 \(R\$ 0,05\) · Big blind: p0 \(R\$ 0,10\)/);
    });

    it('should show the showdown and end the table when one player has all the chips', async () => {
      seatPlayers([100, 100]);
      deck = ['AS', 'AH', 'KS', 'KH', '2C', '7D', '9H', 'JC', '3S'];
      await run('iniciar');
      await run('allin', 0);

      await run('call', 1);

      const texts = groupTexts();
      expect(texts[texts.length - 2]).toBe(
        [
          '🤖 🔥 p1 foi all-in (R$ 1,00 na rodada).',
          '',
          '🃏 *Flop:* [2♣️] [7♦️] [9♥️]',
          '',
          '🃏 *Turn:* [J♣️]',
          '',
          '🃏 *River:* [3♠️]',
          '',
          '*Showdown!*',
          'p0: [A♠️] [A♥️] → Par',
          'p1: [K♠️] [K♥️] → Par',
          `🏆 ${tag(0)} levou o pote de R$ 2,00.`,
          '',
          'Fichas: p0 R$ 2,00 · p1 R$ 0,00',
        ].join('\n')
      );
      expect(texts[texts.length - 1]).toBe(
        [
          '🤖 🏁 *Mesa encerrada!*',
          '🏆 p0 ficou com todas as fichas!',
          '',
          'p0: buy-in R$ 1,00 → R$ 2,00 (+R$ 1,00)',
          'p1: buy-in R$ 1,00 → R$ 0,00 (-R$ 1,00)',
        ].join('\n')
      );
      expect(getTable(GROUP)).toBeNull();
    });

    it('should name the main and side pots and a split pot', async () => {
      seatPlayers([100, 30, 100]);
      // p0 and p2 tie with the board straight; p1 has the best hand but is all-in for less
      deck = ['2C', '3D', '0S', '0H', '2H', '3S', '9S', '8H', '7D', '6C', '5S', ...FILLER];
      await run('iniciar');
      await run('allin', 0);
      await run('allin', 1);

      await run('call', 2);

      const showdown = groupTexts().find((text) => text.includes('Showdown'))!;
      expect(showdown).toContain(`🏆 ${tag(1)} levou o pote principal de R$ 0,90.`);
      expect(showdown).toContain(`🤝 ${tag(2)} e ${tag(0)} dividiram o pote paralelo 1 de R$ 1,40.`);
    });

    it('should finish the hand during the deal when the blinds put everyone all-in', async () => {
      const table = seatPlayers([100, 100]);
      table.players[0].chips = 5;
      table.players[1].chips = 10;
      saveTable(table);
      deck = ['2C', '3D', 'AS', 'AH', '9S', '8H', '7D', 'JC', '4S'];

      await run('iniciar');

      const texts = groupTexts();
      expect(texts[texts.length - 2]).toContain('*Showdown!*');
      expect(texts[texts.length - 1]).toContain('🏆 p1 ficou com todas as fichas!');
      expect(getTable(GROUP)).toBeNull();
    });
  });

  describe('acabar', () => {
    it('should refuse when there is no table', async () => {
      await expect(run('acabar')).rejects.toThrow(WarningError);
    });

    it('should refuse someone who is neither at the table nor an admin', async () => {
      seatPlayers([100, 100]);

      await expect(run('acabar', 9)).rejects.toThrow('Só quem está na mesa ou um admin do grupo pode encerrar a mesa.');
      expect(getTable(GROUP)).not.toBeNull();
    });

    it('should void the hand in progress, send the summary and delete the table', async () => {
      seatPlayers([100, 100, 100]);
      await run('iniciar');
      await run('raise 0,40', 0);

      await run('acabar', 1);

      expect(lastGroupMessage().text).toBe(
        [
          '🤖 🏁 *Mesa encerrada!*',
          'Encerrada por p1.',
          'A mão em andamento foi anulada e as apostas voltaram para cada jogador.',
          '',
          'p0: buy-in R$ 1,00 → R$ 1,00 (+R$ 0,00)',
          'p1: buy-in R$ 1,00 → R$ 1,00 (+R$ 0,00)',
          'p2: buy-in R$ 1,00 → R$ 1,00 (+R$ 0,00)',
        ].join('\n')
      );
      expect(getTable(GROUP)).toBeNull();
    });

    it('should let a group admin end a table before it starts', async () => {
      seatPlayers([100, 100]);
      socket.groupMetadata.mockResolvedValue({ participants: [{ id: jid(9), admin: 'admin' }] });

      await run('acabar', 9);

      expect(lastGroupMessage().text).toContain('Encerrada por um admin.');
      expect(lastGroupMessage().text).not.toContain('anulada');
    });
  });
});
