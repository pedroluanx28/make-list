// Baileys is ESM-only and can't be loaded by Jest's CommonJS runtime
const mockSockets: any[] = [];
jest.mock('@whiskeysockets/baileys', () => ({
  __esModule: true,
  default: jest.fn(() => {
    const handlers: Record<string, (payload: any) => void> = {};
    const socket = {
      authState: { creds: { registered: true } },
      ev: { on: jest.fn((event: string, handler: any) => (handlers[event] = handler)) },
      emit: (event: string, payload: any) => handlers[event](payload),
    };
    mockSockets.push(socket);
    return socket;
  }),
  useMultiFileAuthState: jest.fn(async () => ({ state: { creds: {}, keys: {} }, saveCreds: jest.fn() })),
  fetchLatestBaileysVersion: jest.fn(async () => ({ version: [2, 3000, 1] })),
  makeCacheableSignalKeyStore: jest.fn(),
  DisconnectReason: { loggedOut: 401 },
}));
jest.mock('pino', () => Object.assign(jest.fn(() => ({})), { destination: jest.fn() }));

import { connect } from '../src/connection';

const flush = () => new Promise(setImmediate);

const closeWith = (socket: any, statusCode: number) =>
  socket.emit('connection.update', {
    connection: 'close',
    lastDisconnect: { error: { output: { statusCode } } },
  });

describe('connect', () => {
  beforeEach(() => {
    mockSockets.length = 0;
  });

  it('should hand the socket to the callback', async () => {
    const onSocket = jest.fn();

    const socket = await connect(onSocket);

    expect(onSocket).toHaveBeenCalledWith(socket);
  });

  it('should hand the new socket to the callback when the connection drops and reconnects', async () => {
    const onSocket = jest.fn();
    await connect(onSocket);

    closeWith(mockSockets[0], 503);
    await flush();

    expect(mockSockets).toHaveLength(2);
    expect(onSocket).toHaveBeenLastCalledWith(mockSockets[1]);
  });

  it('should not reconnect after a logout', async () => {
    const onSocket = jest.fn();
    await connect(onSocket);

    closeWith(mockSockets[0], 401);
    await flush();

    expect(mockSockets).toHaveLength(1);
    expect(onSocket).toHaveBeenCalledTimes(1);
  });
});
