// Mock utilities for testing bot commands
export const createMockCommonFunctions = (overrides: Partial<CommonFunctions> = {}): CommonFunctions & {
  sendText: jest.MockedFunction<(text: string, mentions?: string[]) => Promise<void>>;
  sendReply: jest.MockedFunction<(text: string, mentions?: string[]) => Promise<void>>;
  sendReact: jest.MockedFunction<(emoji: string) => Promise<void>>;
  getGroupParticipants: jest.MockedFunction<() => Promise<Participant[]>>;
} => {
  const mockSendText = jest.fn().mockResolvedValue(undefined);
  const mockSendReply = jest.fn().mockResolvedValue(undefined);
  const mockSendReact = jest.fn().mockResolvedValue(undefined);
  const mockSendSuccessReact = jest.fn().mockResolvedValue(undefined);
  const mockSendWaitReact = jest.fn().mockResolvedValue(undefined);
  const mockSendWarningReact = jest.fn().mockResolvedValue(undefined);
  const mockSendErrorReact = jest.fn().mockResolvedValue(undefined);
  const mockSendSuccessReply = jest.fn().mockResolvedValue(undefined);
  const mockSendErrorReply = jest.fn().mockResolvedValue(undefined);
  const mockSendWarningReply = jest.fn().mockResolvedValue(undefined);
  const mockGetGroupParticipants = jest.fn().mockResolvedValue([]);

  return {
    socket: {},
    remoteJid: 'test@g.us',
    userJid: 'user@s.whatsapp.net',
    prefix: '/',
    commandName: 'test',
    fullMessage: '/test message',
    args: [],
    isReply: false,
    isAudio: false,
    isImage: false,
    isVideo: false,
    isSticker: false,
    fullArgs: 'message',
    replyJid: '',
    webMessage: {},
    sendText: mockSendText,
    sendReply: mockSendReply,
    sendReact: mockSendReact,
    sendSuccessReact: mockSendSuccessReact,
    sendWaitReact: mockSendWaitReact,
    sendWarningReact: mockSendWarningReact,
    sendErrorReact: mockSendErrorReact,
    sendSuccessReply: mockSendSuccessReply,
    sendErrorReply: mockSendErrorReply,
    sendWarningReply: mockSendWarningReply,
    isGroup: true,
    getGroupParticipants: mockGetGroupParticipants,
    ...overrides
  } as any;
};

export const createMockParticipants = (count: number = 3): Participant[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user${i + 1}@s.whatsapp.net`,
    admin: i === 0 ? 'admin' : null
  }));
};