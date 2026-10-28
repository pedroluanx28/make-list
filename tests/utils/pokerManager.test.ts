// In-memory filesystem so poker.json is never written to disk
const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
  existsSync: (path: string) => mockFiles.has(path),
  readFileSync: (path: string) => mockFiles.get(path),
  writeFileSync: (path: string, data: string) => mockFiles.set(path, data),
  mkdirSync: jest.fn(),
}));

import { InvalidParameterError, WarningError } from '../../src/errors';
import {
  PokerEvent,
  PokerTable,
  addPlayer,
  applyAction,
  cardsNeeded,
  createTable,
  currentPlayer,
  deleteTable,
  finishTable,
  getOptions,
  getTable,
  parseAmount,
  potTotal,
  saveTable,
  startHand,
  timeBankLeft,
  useTimeBank,
  withTableLock,
} from '../../src/utils/pokerManager';

const GROUP = 'group@g.us';
const jid = (seat: number) => `p${seat}@s.whatsapp.net`;

// Filler cards that never make a hand better than the ones a test sets
const FILLER = ['2C', '3D', '4H', '6S', '8C', '9D', 'JH', '2S', '3C', '4D', '6H', '8S', '9C', 'JD', '2D', '3H', '4C', '6D', '8H', '9S'];

const setupTable = (buyIns: number[], minimum = 10): PokerTable => {
  const table = createTable(GROUP, minimum);
  buyIns.forEach((buyIn, seat) => addPlayer(table, jid(seat), `p${seat}`, buyIn));
  return table;
};

// Cards are dealt two per player starting at the button, then the five board cards
const deal = (holes: string[][], board: string[]) => [...holes.flat(), ...board];

const fillerDeal = (players: number) => FILLER.slice(0, players * 2 + 5);

const turnOf = (events: PokerEvent[]) => {
  const turn = events.filter((event) => event.type === 'turn').pop();
  return turn && turn.type === 'turn' ? turn.jid : null;
};

const act = (table: PokerTable, seat: number, action: any, amount?: number) =>
  applyAction(table, jid(seat), action, amount);

describe('pokerManager', () => {
  beforeEach(() => {
    mockFiles.clear();
  });

  describe('persistence', () => {
    it('should return null when there is no poker file', () => {
      expect(getTable(GROUP)).toBeNull();
    });

    it('should save and load a table by group', () => {
      const table = setupTable([100, 100]);
      saveTable(table);

      expect(getTable(GROUP)).toEqual(table);
      expect(getTable('other@g.us')).toBeNull();
    });

    it('should write into an existing assets directory without creating it', () => {
      const fs = require('fs');
      saveTable(setupTable([100, 100]));
      const [path] = [...mockFiles.keys()];
      mockFiles.set(path.replace(/[\\/]poker\.json$/, ''), '');
      fs.mkdirSync.mockClear();

      saveTable(setupTable([100, 200]));

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should delete only the table of the given group', () => {
      saveTable(setupTable([100, 100]));
      saveTable({ ...createTable('other@g.us'), chatId: 'other@g.us' });

      deleteTable(GROUP);

      expect(getTable(GROUP)).toBeNull();
      expect(getTable('other@g.us')).not.toBeNull();
    });

    it.each([
      ['corrupted JSON', '{oops'],
      ['an array', '[]'],
    ])('should treat %s as no table', (_label, content) => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      saveTable(setupTable([100, 100]));
      const [path] = [...mockFiles.keys()];
      mockFiles.set(path, content);

      expect(getTable(GROUP)).toBeNull();
      errorSpy.mockRestore();
    });
  });

  describe('parseAmount', () => {
    it.each([
      ['0.10', 10],
      ['0,5', 50],
      ['50', 5000],
      ['1.25', 125],
    ])('should read %s as %d cents', (text, cents) => {
      expect(parseAmount(text)).toBe(cents);
    });

    it.each(['abc', '1.234', '-1', '', '0', '0,00', undefined])('should reject %p', (text) => {
      expect(() => parseAmount(text as any)).toThrow(InvalidParameterError);
    });
  });

  describe('createTable', () => {
    it('should default the minimum to 0.10 with a 0.05 small blind', () => {
      const table = createTable(GROUP);

      expect(table.minimum).toBe(10);
      expect(table.smallBlind).toBe(5);
      expect(table.players).toEqual([]);
      expect(table.started).toBe(false);
    });

    it('should round the small blind down to whole cents', () => {
      expect(createTable(GROUP, 15).smallBlind).toBe(7);
    });

    it('should reject a minimum without a small blind of at least one cent', () => {
      expect(() => createTable(GROUP, 1)).toThrow(InvalidParameterError);
    });
  });

  describe('addPlayer', () => {
    it('should seat players in join order with their buy-in as chips', () => {
      const table = setupTable([100, 250]);

      expect(table.players.map((player) => [player.name, player.chips])).toEqual([
        ['p0', 100],
        ['p1', 250],
      ]);
    });

    it('should refuse a player once the table has started', () => {
      const table = setupTable([100, 100]);
      startHand(table, fillerDeal(2));

      expect(() => addPlayer(table, jid(5), 'late', 100)).toThrow(WarningError);
    });

    it('should refuse the same person twice', () => {
      const table = setupTable([100]);

      expect(() => addPlayer(table, jid(0), 'again', 100)).toThrow('Você já está na mesa.');
    });

    it('should refuse an 11th player', () => {
      const table = setupTable(Array(10).fill(100));

      expect(() => addPlayer(table, jid(10), 'p10', 100)).toThrow(WarningError);
    });

    it.each(['', 'a'.repeat(21)])('should refuse the name %p', (name) => {
      const table = setupTable([]);

      expect(() => addPlayer(table, jid(0), name, 100)).toThrow(InvalidParameterError);
    });

    it('should refuse a name already used, ignoring case', () => {
      const table = setupTable([100]);

      expect(() => addPlayer(table, jid(1), 'P0', 100)).toThrow(WarningError);
    });

    it('should accept a buy-in of exactly 200 times the table minimum', () => {
      const table = setupTable([]);

      addPlayer(table, jid(0), 'p0', 2000);

      expect(table.players[0].chips).toBe(2000);
    });

    it('should refuse a buy-in above 200 times the table minimum', () => {
      const table = setupTable([]);

      expect(() => addPlayer(table, jid(0), 'p0', 2001)).toThrow(
        'o buy-in máximo é R$ 20,00 (200 vezes o mínimo da mesa).'
      );
    });

    it('should accept a buy-in of exactly 10 times the table minimum', () => {
      const table = setupTable([]);

      addPlayer(table, jid(0), 'p0', 100);

      expect(table.players[0].chips).toBe(100);
    });

    it('should refuse a buy-in below 10 times the table minimum', () => {
      const table = setupTable([]);

      expect(() => addPlayer(table, jid(0), 'p0', 99)).toThrow(
        'o buy-in mínimo é R$ 1,00 (10 vezes o mínimo da mesa).'
      );
    });
  });

  describe('startHand', () => {
    it('should make the first player the button, the second the small blind and the third the big blind', () => {
      const table = setupTable([100, 100, 100]);

      const events = startHand(table, fillerDeal(3));

      expect(table.dealer).toBe(0);
      expect(events[0]).toEqual({ type: 'blinds', smallBlind: jid(1), bigBlind: jid(2) });
      expect(table.players.map((player) => player.chips)).toEqual([100, 95, 90]);
      expect(potTotal(table)).toBe(15);
    });

    it('should start preflop with the player left of the big blind', () => {
      const table = setupTable([100, 100, 100, 100]);

      const events = startHand(table, fillerDeal(4));

      expect(turnOf(events)).toBe(jid(3));
      expect(currentPlayer(table)!.jid).toBe(jid(3));
    });

    it('should have no player to act before the first hand', () => {
      expect(currentPlayer(setupTable([100, 100]))).toBeNull();
    });

    it('should deal two cards to each player and keep five for the board', () => {
      const table = setupTable([100, 100, 100]);
      const cards = fillerDeal(3);

      startHand(table, cards);

      expect(table.players.map((player) => player.cards)).toEqual([cards.slice(0, 2), cards.slice(2, 4), cards.slice(4, 6)]);
      expect(table.hand!.deck).toEqual(cards.slice(6));
      expect(cardsNeeded(table)).toBe(11);
    });

    it('should make the button the small blind and first to act preflop in heads-up', () => {
      const table = setupTable([100, 100]);

      const events = startHand(table, fillerDeal(2));

      expect(events[0]).toEqual({ type: 'blinds', smallBlind: jid(0), bigBlind: jid(1) });
      expect(turnOf(events)).toBe(jid(0));
    });

    it('should move the button clockwise and skip players without chips on the next hand', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));
      finishTable(table);
      table.players[1].chips = 0;

      const events = startHand(table, fillerDeal(2));

      expect(table.dealer).toBe(2);
      expect(table.players[1].inHand).toBe(false);
      expect(table.players[1].cards).toEqual([]);
      expect(events[0]).toEqual({ type: 'blinds', smallBlind: jid(2), bigBlind: jid(0) });
    });

    it('should put a short big blind all-in with what is left', () => {
      const table = setupTable([100, 100, 100]);
      table.players[2].chips = 6;

      startHand(table, fillerDeal(3));

      expect(table.players[2].chips).toBe(0);
      expect(table.players[2].allIn).toBe(true);
      expect(table.players[2].bet).toBe(6);
    });

    it('should refuse to start with fewer than two players with chips', () => {
      const table = setupTable([100]);

      expect(() => startHand(table, fillerDeal(1))).toThrow(WarningError);
    });
  });

  describe('applyAction validation', () => {
    it('should refuse an action when no hand is in progress', () => {
      const table = setupTable([100, 100]);

      expect(() => act(table, 0, 'call')).toThrow(WarningError);
    });

    it('should refuse an action out of turn naming the player to act', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      expect(() => act(table, 1, 'call')).toThrow('Não é sua vez. Agora é a vez de p0.');
    });

    it('should refuse an action from someone not playing the hand', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      expect(() => applyAction(table, 'stranger@s.whatsapp.net', 'call')).toThrow('Você não está jogando esta mão.');
    });

    it('should refuse a repeated action once the turn has passed', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));
      act(table, 0, 'call');

      expect(() => act(table, 0, 'call')).toThrow(WarningError);
    });

    it('should refuse a check when there is a bet to pay', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      expect(() => act(table, 0, 'check')).toThrow(/Não dá para dar check: há R\$ 0,10 para pagar/);
    });

    it('should refuse a call when there is nothing to pay', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));
      act(table, 0, 'call');
      act(table, 1, 'call');

      expect(() => act(table, 2, 'call')).toThrow('Não há aposta para pagar. Use check.');
    });

    it('should refuse a raise below the minimum raise', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      expect(() => act(table, 0, 'raise', 15)).toThrow('O raise mínimo é para R$ 0,20.');
    });

    it('should refuse a raise above the player chips', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      expect(() => act(table, 0, 'raise', 101)).toThrow(/Você só tem R\$ 1,00 em fichas/);
    });

    it('should refuse an all-in raise that does not pass the current bet', () => {
      const table = setupTable([100, 100, 100]);
      table.players[0].chips = 8;
      startHand(table, fillerDeal(3));

      expect(() => act(table, 0, 'raise', 8)).toThrow(/precisa passar a aposta atual/);
    });
  });

  describe('betting', () => {
    it('should pay the difference on call and pass the turn', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      const events = act(table, 0, 'call');

      expect(events[0]).toEqual({ type: 'action', jid: jid(0), action: 'call', total: 10, allIn: false });
      expect(table.players[0].chips).toBe(90);
      expect(turnOf(events)).toBe(jid(1));
    });

    it('should turn a call the player cannot cover into an all-in', () => {
      const table = setupTable([100, 100, 100]);
      table.players[0].chips = 4;
      startHand(table, fillerDeal(3));

      const events = act(table, 0, 'call');

      expect(events[0]).toEqual({ type: 'action', jid: jid(0), action: 'allin', total: 4, allIn: true });
    });

    it('should double the current bet when raise has no value', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      act(table, 0, 'raise');

      expect(table.players[0].bet).toBe(20);
      expect(table.hand!.currentBet).toBe(20);
    });

    it('should raise to the value given', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      act(table, 0, 'raise', 35);

      expect(table.players[0].bet).toBe(35);
      expect(table.hand!.minRaise).toBe(25);
    });

    it('should accept a raise of all the chips below the minimum as an all-in', () => {
      const table = setupTable([100, 100, 100]);
      table.players[0].chips = 15;
      startHand(table, fillerDeal(3));

      const events = act(table, 0, 'raise', 15);

      expect(events[0]).toMatchObject({ action: 'allin', total: 15 });
    });

    it('should give the big blind the option when everyone only called', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));
      act(table, 0, 'call');

      const events = act(table, 1, 'call');

      expect(turnOf(events)).toBe(jid(2));
      expect(table.hand!.street).toBe('preflop');
    });

    it('should reopen the betting after a full raise', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));
      act(table, 0, 'call');
      act(table, 1, 'call');

      const events = act(table, 2, 'raise');

      expect(turnOf(events)).toBe(jid(0));
      expect(table.players[0].acted).toBe(false);
    });

    it('should not let who already acted re-raise after a short all-in', () => {
      const table = setupTable([100, 100, 100]);
      table.players[2].chips = 60;
      startHand(table, fillerDeal(3));
      act(table, 0, 'raise', 40); // a raise of 30: the next full raise must add 30 more
      act(table, 1, 'call');
      act(table, 2, 'allin'); // to 60: a raise of only 20

      expect(table.hand!.currentBet).toBe(60);
      expect(() => act(table, 0, 'raise', 60)).toThrow(/não reabriu as apostas/);
      expect(() => act(table, 0, 'allin')).toThrow(/não reabriu as apostas/);
      expect(getOptions(table).some((line) => line.startsWith('raise'))).toBe(false);
      expect(getOptions(table).some((line) => line.startsWith('allin'))).toBe(false);

      act(table, 0, 'call');
      expect(table.players[0].bet).toBe(60);
    });

    it('should open the flop with three board cards and the first active player left of the button', () => {
      const table = setupTable([100, 100, 100]);
      const cards = fillerDeal(3);
      startHand(table, cards);
      act(table, 0, 'call');
      act(table, 1, 'call');

      const events = act(table, 2, 'check');

      expect(events).toContainEqual({ type: 'street', street: 'flop', cards: cards.slice(6, 9), board: cards.slice(6, 9) });
      expect(turnOf(events)).toBe(jid(1));
      expect(table.hand!.currentBet).toBe(0);
      expect(table.players.every((player) => player.bet === 0)).toBe(true);
    });

    it('should let the big blind act first after the flop in heads-up', () => {
      const table = setupTable([100, 100]);
      startHand(table, fillerDeal(2));
      act(table, 0, 'call');

      const events = act(table, 1, 'check');

      expect(turnOf(events)).toBe(jid(1));
    });

    it('should reveal the turn and the river one card at a time', () => {
      const table = setupTable([100, 100]);
      const cards = fillerDeal(2);
      startHand(table, cards);
      act(table, 0, 'call');
      act(table, 1, 'check');
      act(table, 1, 'check');

      const turn = act(table, 0, 'check');
      expect(turn).toContainEqual({ type: 'street', street: 'turn', cards: [cards[7]], board: cards.slice(4, 8) });

      act(table, 1, 'check');
      const river = act(table, 0, 'check');
      expect(river).toContainEqual({ type: 'street', street: 'river', cards: [cards[8]], board: cards.slice(4, 9) });
      expect(table.hand!.board).toEqual(cards.slice(4, 9));
    });

    it('should open the first bet after the flop at the table minimum by default', () => {
      const table = setupTable([100, 100]);
      startHand(table, fillerDeal(2));
      act(table, 0, 'call');
      act(table, 1, 'check');

      act(table, 1, 'raise');

      expect(table.players[1].bet).toBe(10);
    });

    it('should give the pot to the last player when everyone else folds', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));
      act(table, 0, 'fold');

      const events = act(table, 1, 'fold');

      expect(events).toContainEqual({ type: 'foldWin', jid: jid(2), amount: 15 });
      expect(table.players.map((player) => player.chips)).toEqual([100, 95, 105]);
      expect(table.hand).toBeNull();
    });
  });

  describe('showdown', () => {
    it('should reveal the remaining board without betting when everyone is all-in', () => {
      const table = setupTable([100, 100]);
      const cards = deal([['AS', 'AH'], ['KS', 'KH']], ['2C', '7D', '9H', 'JC', '3S']);
      startHand(table, cards);
      act(table, 0, 'allin');

      const events = act(table, 1, 'call');

      expect(events.filter((event) => event.type === 'street').map((event: any) => event.street)).toEqual([
        'flop',
        'turn',
        'river',
      ]);
      expect(events[events.length - 1]).toEqual({
        type: 'showdown',
        hands: [
          { jid: jid(0), cards: ['AS', 'AH'], handName: 'Par' },
          { jid: jid(1), cards: ['KS', 'KH'], handName: 'Par' },
        ],
        pots: [{ amount: 200, winners: [jid(0)] }],
      });
      expect(table.players.map((player) => player.chips)).toEqual([200, 0]);
    });

    it('should split side pots so a short all-in only wins the main pot', () => {
      const table = setupTable([100, 100, 100]);
      table.players[1].chips = 30;
      const cards = deal([['KS', 'KH'], ['AS', 'AH'], ['2C', '7D']], ['AD', 'KD', '9C', '5S', '3H']);
      startHand(table, cards);
      act(table, 0, 'allin');
      act(table, 1, 'allin');

      const events = act(table, 2, 'call');

      const showdown = events[events.length - 1] as any;
      expect(showdown.pots).toEqual([
        { amount: 90, winners: [jid(1)] },
        { amount: 140, winners: [jid(0)] },
      ]);
      expect(table.players.map((player) => player.chips)).toEqual([140, 90, 0]);
    });

    it('should split a tied pot and give the odd cent to the first winner left of the button', () => {
      const table = setupTable([100, 100, 100]);
      const cards = deal([['2C', '3D'], ['KH', 'KD'], ['2H', '3S']], ['9S', '8H', '7D', '6C', '5S']);
      startHand(table, cards);
      act(table, 0, 'call');
      act(table, 1, 'fold');
      act(table, 2, 'check');
      for (let street = 0; street < 3; street++) {
        act(table, 2, 'check');
        act(table, 0, 'check');
      }

      expect(table.hand).toBeNull();
      // Pot of 25: 12 each and the odd cent to seat 2, the first winner left of the button
      expect(table.players.map((player) => player.chips)).toEqual([102, 95, 103]);
    });

    it('should name the hand of each player still in at the showdown', () => {
      const table = setupTable([100, 100]);
      const cards = deal([['AS', 'KS'], ['2H', '2D']], ['QS', 'JS', '0S', '4C', '5D']);
      startHand(table, cards);
      act(table, 0, 'allin');

      const events = act(table, 1, 'call');

      const showdown = events[events.length - 1] as any;
      expect(showdown.hands.map((hand: any) => hand.handName)).toEqual(['Royal flush', 'Par']);
    });
  });

  describe('getOptions', () => {
    it('should offer call, raise with the doubled default, fold and all-in when there is a bet', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));

      expect(getOptions(table)).toEqual([
        'call → pagar R$ 0,10',
        'raise [valor] → aumentar a aposta para [valor] (padrão: o dobro, R$ 0,20; mínimo R$ 0,20)',
        'fold → desistir da mão',
        'allin → apostar todas as suas fichas (R$ 1,00)',
      ]);
    });

    it('should offer check and a bet at the table minimum when nobody bet', () => {
      const table = setupTable([100, 100]);
      startHand(table, fillerDeal(2));
      act(table, 0, 'call');
      act(table, 1, 'check');

      expect(getOptions(table)).toEqual([
        'check → passar a vez sem apostar',
        'raise [valor] → apostar (padrão: R$ 0,10)',
        'fold → desistir da mão',
        'allin → apostar todas as suas fichas (R$ 0,90)',
      ]);
    });

    it('should offer only an all-in call when the player cannot cover the bet', () => {
      const table = setupTable([100, 100, 100]);
      table.players[0].chips = 8;
      startHand(table, fillerDeal(3));

      expect(getOptions(table)).toEqual([
        'call → pagar R$ 0,08 (all-in)',
        'fold → desistir da mão',
        'allin → apostar todas as suas fichas (R$ 0,08)',
      ]);
    });
  });

  describe('finishTable', () => {
    it('should report buy-in, final chips and balance of each player', () => {
      const table = setupTable([100, 100]);
      table.players[0].chips = 150;
      table.players[1].chips = 50;

      expect(finishTable(table)).toEqual([
        { name: 'p0', buyIn: 100, chips: 150, balance: 50 },
        { name: 'p1', buyIn: 100, chips: 50, balance: -50 },
      ]);
    });

    it('should give back every bet of a hand in progress', () => {
      const table = setupTable([100, 100, 100]);
      startHand(table, fillerDeal(3));
      act(table, 0, 'raise', 40);

      const summary = finishTable(table);

      expect(summary.map((player) => player.chips)).toEqual([100, 100, 100]);
      expect(table.hand).toBeNull();
    });
  });

  describe('time bank', () => {
    it('should give each player 3 extensions when they join', () => {
      const table = setupTable([100, 100]);

      expect(table.players.map(timeBankLeft)).toEqual([3, 3]);
    });

    it('should spend one extension at a time and report none left after the third', () => {
      const table = setupTable([100, 100]);

      expect([useTimeBank(table, jid(0)), useTimeBank(table, jid(0)), useTimeBank(table, jid(0))]).toEqual([2, 1, 0]);
      expect(useTimeBank(table, jid(0))).toBeNull();
      expect(timeBankLeft(table.players[1])).toBe(3);
    });

    it('should not refill the extensions on the next hand', () => {
      const table = setupTable([100, 100]);
      useTimeBank(table, jid(0));

      startHand(table, fillerDeal(2));

      expect(timeBankLeft(table.players[0])).toBe(2);
    });

    it('should count 3 extensions for a player saved before the time bank existed', () => {
      const table = setupTable([100, 100]);
      delete table.players[0].timeBank;

      expect(timeBankLeft(table.players[0])).toBe(3);
      expect(useTimeBank(table, jid(0))).toBe(2);
    });
  });

  describe('withTableLock', () => {
    it('should run tasks of the same group one at a time', async () => {
      const order: string[] = [];
      let release: () => void = () => {};
      const first = withTableLock(GROUP, () => new Promise<void>((resolve) => {
        order.push('first start');
        release = () => {
          order.push('first end');
          resolve();
        };
      }));
      const second = withTableLock(GROUP, async () => {
        order.push('second');
      });

      await new Promise(setImmediate);
      release();
      await Promise.all([first, second]);

      expect(order).toEqual(['first start', 'first end', 'second']);
    });

    it('should keep running tasks after one fails', async () => {
      const failed = withTableLock(GROUP, async () => {
        throw new Error('boom');
      });

      await expect(failed).rejects.toThrow('boom');
      await expect(withTableLock(GROUP, async () => 'ok')).resolves.toBe('ok');
    });
  });
});
