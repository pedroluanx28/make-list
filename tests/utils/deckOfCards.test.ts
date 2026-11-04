import { cardImageUrl, drawCards } from '../../src/utils/deckOfCards';
import { DangerError } from '../../src/errors';

const mockFetch = jest.fn();

const apiResponse = (codes: string[], success = true) => ({
  json: async () => ({ success, deck_id: 'abc', cards: codes.map((code) => ({ code })) }),
});

describe('deckOfCards', () => {
  beforeAll(() => {
    global.fetch = mockFetch as any;
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should draw the requested number of cards from a new shuffled deck in one request', async () => {
    mockFetch.mockResolvedValue(apiResponse(['AS', '0H', '7C']));

    const cards = await drawCards(3);

    expect(cards).toEqual(['AS', '0H', '7C']);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('https://deckofcardsapi.com/api/deck/new/draw/?count=3');
  });

  it('should throw a DangerError when the request fails', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));

    await expect(drawCards(3)).rejects.toThrow(DangerError);
  });

  it('should throw a DangerError when the API answers without success', async () => {
    mockFetch.mockResolvedValue(apiResponse(['AS', '0H', '7C'], false));

    await expect(drawCards(3)).rejects.toThrow(DangerError);
  });

  it('should throw a DangerError when the API returns fewer cards than requested', async () => {
    mockFetch.mockResolvedValue(apiResponse(['AS']));

    await expect(drawCards(3)).rejects.toThrow(DangerError);
  });

  it('should build the PNG image URL of a card', () => {
    expect(cardImageUrl('6H')).toBe('https://deckofcardsapi.com/static/img/6H.png');
  });
});
