import { formatCard, formatCards } from '../../src/utils/pokerHand';

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
});
