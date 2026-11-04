import { compareScores, evaluateHand, formatCard, formatCards } from '../../src/utils/pokerHand';

const hand = (cards: string) => evaluateHand(cards.split(' '));
const beats = (a: string, b: string) => compareScores(hand(a).score, hand(b).score) > 0;

describe('pokerHand', () => {
  describe('formatCard', () => {
    it.each([
      ['0H', '[10♥️]'],
      ['6H', '[6♥️]'],
      ['AS', '[A♠️]'],
      ['KD', '[K♦️]'],
      ['7C', '[7♣️]'],
    ])('should format %s as %s', (code, text) => {
      expect(formatCard(code)).toBe(text);
    });

    it('should join several cards with a space', () => {
      expect(formatCards(['0H', '6H'])).toBe('[10♥️] [6♥️]');
    });
  });

  describe('evaluateHand', () => {
    it.each([
      ['AS KS QS JS 0S 2H 3D', 'Royal flush'],
      ['9H 8H 7H 6H 5H AS AD', 'Straight flush'],
      ['7S 7H 7D 7C 2S 3H 4D', 'Quadra'],
      ['KS KH KD 2C 2S 9H 4D', 'Full house'],
      ['AH 9H 7H 4H 2H KS KD', 'Flush'],
      ['9S 8H 7D 6C 5S KH 2D', 'Sequência'],
      ['AS 2H 3D 4C 5S KH 9D', 'Sequência'],
      ['QS QH QD 2C 7S 9H 4D', 'Trinca'],
      ['JS JH 4D 4C 9S 2H 3D', 'Dois pares'],
      ['0S 0H 4D 8C 9S 2H 3D', 'Par'],
      ['AS 0H 4D 8C 9S 2H 3D', 'Carta alta'],
    ])('should name %s as %s', (cards, name) => {
      expect(hand(cards).name).toBe(name);
    });

    it('should pick the best 5 of 7 cards', () => {
      // The board pair loses to the flush made with the hand
      expect(hand('2H 9H AH 4H 7H 2S KD').name).toBe('Flush');
    });

    it('should rank a higher category above a lower one', () => {
      expect(beats('KS KH KD 2C 2S 9H 4D', 'AH 9H 7H 4H 2H KS KD')).toBe(true);
    });

    it('should break ties by kicker', () => {
      expect(beats('AS AH KD 8C 7S', 'AD AC QD 8H 7D')).toBe(true);
    });

    it('should rank the wheel as the lowest straight', () => {
      expect(beats('6S 5H 4D 3C 2S', 'AS 2H 3D 4C 5S')).toBe(true);
    });

    it('should compare two pairs by the high pair, then the low pair', () => {
      expect(beats('KS KH 3D 3C 2S', 'QS QH JD JC AS')).toBe(true);
      expect(beats('KS KH 5D 5C 2S', 'KD KC 4D 4C AS')).toBe(true);
    });

    it('should report a tie when both hands play the board', () => {
      expect(compareScores(hand('AS KD QH JC 9S 2H 3D').score, hand('AS KD QH JC 9S 4H 5D').score)).toBe(0);
    });
  });
});
