import { ping } from '../../../src/commands/member/ping';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

describe('ping command', () => {
  it('should have correct command metadata', () => {
    expect(ping.name).toBe('ping');
    expect(ping.description).toBe('Verificar conexão com o bot');
    expect(ping.commands).toEqual(['ping']);
    expect(ping.usage).toBe('/ping');
  });

  it('should send react and reply when executed', async () => {
    const mockFunctions = createMockCommonFunctions();
    
    await ping.handle(mockFunctions);
    
    expect(mockFunctions.sendReact).toHaveBeenCalledWith('🏓');
    expect(mockFunctions.sendReply).toHaveBeenCalledWith('Pong! 🏓');
    expect(mockFunctions.sendReact).toHaveBeenCalledTimes(1);
    expect(mockFunctions.sendReply).toHaveBeenCalledTimes(1);
  });
});