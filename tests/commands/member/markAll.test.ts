import { markAll } from '../../../src/commands/member/markAll';
import { createMockCommonFunctions, createMockParticipants } from '../../mocks/commonFunctions';

describe('markAll command', () => {
  it('should have correct command metadata', () => {
    expect(markAll.name).toBe('markAll');
    expect(markAll.description).toBe('Marca todos os membros de um grupo');
    expect(markAll.commands).toEqual(['markall', 'all', 'todes']);
    expect(markAll.usage).toBe('/markall');
  });

  it('should send error when no participants found', async () => {
    const mockFunctions = createMockCommonFunctions();
    mockFunctions.getGroupParticipants.mockResolvedValue([]);
    
    await markAll.handle(mockFunctions);
    
    expect(mockFunctions.sendReply).toHaveBeenCalledWith('Não consegui obter os membros do grupo.');
  });

  it('should mention all participants and check group at the end', async () => {
    const participants = createMockParticipants(3);
    const mockFunctions = createMockCommonFunctions({ isGroup: false });
    mockFunctions.getGroupParticipants.mockResolvedValue(participants);
    
    await markAll.handle(mockFunctions);
    
    // Should first send the reaction and mention message
    expect(mockFunctions.sendReact).toHaveBeenCalledWith('');
    expect(mockFunctions.sendReply).toHaveBeenCalledWith(
      expect.stringContaining('📢 *ATENÇÃO*'),
      ['user1@s.whatsapp.net', 'user2@s.whatsapp.net', 'user3@s.whatsapp.net']
    );
    // Then check if it's a group and send error message
    expect(mockFunctions.sendReply).toHaveBeenCalledWith('Este comando só pode ser usado em grupos.');
  });

  it('should work properly when in group', async () => {
    const participants = createMockParticipants(3);
    const mockFunctions = createMockCommonFunctions({ isGroup: true });
    mockFunctions.getGroupParticipants.mockResolvedValue(participants);
    
    await markAll.handle(mockFunctions);
    
    expect(mockFunctions.sendReact).toHaveBeenCalledWith('');
    expect(mockFunctions.sendReply).toHaveBeenCalledWith(
      expect.stringContaining('📢 *ATENÇÃO*'),
      ['user1@s.whatsapp.net', 'user2@s.whatsapp.net', 'user3@s.whatsapp.net']
    );
    // Should not send the group error message
    expect(mockFunctions.sendReply).not.toHaveBeenCalledWith('Este comando só pode ser usado em grupos.');
  });

  it('should send additional text when fullArgs provided', async () => {
    const participants = createMockParticipants(2);
    const mockFunctions = createMockCommonFunctions({ 
      isGroup: true, 
      fullArgs: 'Reunião importante!' 
    });
    mockFunctions.getGroupParticipants.mockResolvedValue(participants);
    
    await markAll.handle(mockFunctions);
    
    expect(mockFunctions.sendText).toHaveBeenCalledWith('Reunião importante!');
  });
});