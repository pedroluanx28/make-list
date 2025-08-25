import { drawTeams } from '../../../src/commands/member/drawTeams';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

describe('drawTeams command', () => {
  it('should have correct command metadata', () => {
    expect(drawTeams.name).toBe('Sortear times');
    expect(drawTeams.description).toBe('Sortear times a partir de uma lista');
    expect(drawTeams.commands).toEqual(['drawteams']);
    expect(drawTeams.usage).toBe('/draw-teams');
  });

  it('should reply with error when no list is provided', async () => {
    const mockFunctions = createMockCommonFunctions({ 
      fullMessage: '/drawteams' 
    });
    
    await drawTeams.handle(mockFunctions);
    
    expect(mockFunctions.sendReply).toHaveBeenCalledWith('Nenhuma lista foi enviada');
  });

  it('should reply with error when no valid list items found', async () => {
    const mockFunctions = createMockCommonFunctions({ 
      fullMessage: '/drawteams\nSome text without dashes\nMore text' 
    });
    
    await drawTeams.handle(mockFunctions);
    
    expect(mockFunctions.sendReply).toHaveBeenCalledWith('Nenhuma lista foi enviada');
  });

  it('should create teams from list of players', async () => {
    const mockFunctions = createMockCommonFunctions({ 
      fullMessage: '/drawteams\n- João\n- Maria\n- Pedro\n- Ana\n- Carlos\n- Lucia' 
    });
    
    await drawTeams.handle(mockFunctions);
    
    const replyCall = (mockFunctions.sendReply as jest.MockedFunction<any>).mock.calls[0][0];
    expect(replyCall).toMatch(/\*Time \d+:\*/);
    expect(replyCall).toContain('-João');
    expect(replyCall).toContain('-Maria');
    expect(replyCall).toContain('-Pedro');
    expect(replyCall).toContain('-Ana');
    expect(replyCall).toContain('-Carlos');
    expect(replyCall).toContain('-Lucia');
  });

  it('should handle seeds (players with crown emoji) properly', async () => {
    const mockFunctions = createMockCommonFunctions({ 
      fullMessage: '/drawteams\n- João 👑\n- Maria\n- Pedro 👑\n- Ana\n- Carlos\n- Lucia' 
    });
    
    await drawTeams.handle(mockFunctions);
    
    const replyCall = (mockFunctions.sendReply as jest.MockedFunction<any>).mock.calls[0][0];
    // Should create teams and distribute seeds across different teams
    expect(replyCall).toMatch(/\*Time \d+:\*/);
    expect(replyCall).toContain('-João 👑');
    expect(replyCall).toContain('-Pedro 👑');
  });

  it('should create multiple teams when more than 6 players', async () => {
    const players = Array.from({ length: 10 }, (_, i) => `- Player${i + 1}`);
    const fullMessage = `/drawteams\n${players.join('\n')}`;
    
    const mockFunctions = createMockCommonFunctions({ fullMessage });
    
    await drawTeams.handle(mockFunctions);
    
    const replyCall = (mockFunctions.sendReply as jest.MockedFunction<any>).mock.calls[0][0];
    // Should have multiple teams
    expect(replyCall).toMatch(/\*Time 1:\*/);
    expect(replyCall).toMatch(/\*Time 2:\*/);
  });

  it('should limit teams to maximum 6 players each', async () => {
    const players = Array.from({ length: 8 }, (_, i) => `- Player${i + 1}`);
    const fullMessage = `/drawteams\n${players.join('\n')}`;
    
    const mockFunctions = createMockCommonFunctions({ fullMessage });
    
    await drawTeams.handle(mockFunctions);
    
    const replyCall = (mockFunctions.sendReply as jest.MockedFunction<any>).mock.calls[0][0];
    
    // Count how many players are in each team
    const teams = replyCall.split('*Time').slice(1); // Remove first empty element
    teams.forEach(team => {
      const playerCount = (team.match(/-Player/g) || []).length;
      expect(playerCount).toBeLessThanOrEqual(6);
    });
  });
});