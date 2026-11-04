import { extractDataFromMessage } from '../../src/utils';

const textMessage = (text: string) => ({
  key: { remoteJid: 'test@g.us', participant: 'user@s.whatsapp.net' },
  message: { conversation: text },
});

describe('extractDataFromMessage', () => {
  it.each(['/', '.'])('should read the command name and prefix when the message starts with %p', (prefix) => {
    const data = extractDataFromMessage(textMessage(`${prefix}poker entrar Pedro 50`));

    expect(data.prefix).toBe(prefix);
    expect(data.commandName).toBe('poker');
    expect(data.fullArgs).toBe('entrar Pedro 50');
  });

  it('should strip repeated prefixes before the command name', () => {
    const data = extractDataFromMessage(textMessage('..ping'));

    expect(data.prefix).toBe('.');
    expect(data.commandName).toBe('ping');
  });

  it('should keep the first character as prefix when the message has no known prefix', () => {
    const data = extractDataFromMessage(textMessage('poker'));

    expect(data.prefix).toBe('p');
    expect(data.commandName).toBe('poker');
  });

  it('should leave an empty command name for a message made only of dots', () => {
    const data = extractDataFromMessage(textMessage('...'));

    expect(data.commandName).toBe('');
  });
});
