// Baileys is ESM-only and can't be loaded by Jest's CommonJS runtime
jest.mock('@whiskeysockets/baileys', () => ({
  decryptPollVote: jest.fn(),
  jidNormalizedUser: (jid: string) => jid,
}));

import { listenToMessages } from '../src/loader';
import { getActiveSocket } from '../src/utils/activeSocket';

const createSocket = () => ({ ev: { on: jest.fn() } });

describe('listenToMessages', () => {
  it('should make the socket the active one for scheduled work', () => {
    const socket = createSocket();

    listenToMessages(socket);

    expect(getActiveSocket()).toBe(socket);
  });

  it('should replace the active socket with the one created after a reconnection', () => {
    const first = createSocket();
    const second = createSocket();

    listenToMessages(first);
    listenToMessages(second);

    expect(getActiveSocket()).toBe(second);
  });
});
