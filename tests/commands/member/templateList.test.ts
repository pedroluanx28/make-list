import { templateList } from '../../../src/commands/member/templateList';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

describe('templateList command', () => {
  it('should have correct command metadata', () => {
    expect(templateList.name).toBe('Template de Lista');
    expect(templateList.description).toBe('Cria um template de lista');
    expect(templateList.commands).toEqual(['racha', 'templatelist']);
    expect(templateList.usage).toBe('/templatelist');
  });

  it('should show help when --help is provided', async () => {
    const mockFunctions = createMockCommonFunctions({ 
      fullArgs: 'some args --help more args' 
    });
    
    await templateList.handle(mockFunctions);
    
    expect(mockFunctions.sendReply).toHaveBeenCalledWith(
      expect.stringContaining('*Aqui estão as variaveis que você pode usar:*')
    );
    expect(mockFunctions.sendReply).toHaveBeenCalledWith(
      expect.stringContaining('_local:_ Local do racha')
    );
  });

  it('should create template with default values when no args provided', async () => {
    const mockFunctions = createMockCommonFunctions({ fullArgs: '' });
    
    await templateList.handle(mockFunctions);
    
    expect(mockFunctions.sendReply).toHaveBeenCalledWith(
      '\n*Racha*\n🏟 Local: Não definido\n💵 Preço: Não definido\n⏰ Horário: Não definido'
    );
  });

  it('should create template with parsed arguments', async () => {
    const mockFunctions = createMockCommonFunctions({ 
      fullArgs: 'local="Campo do Clube" valor="R$ 20,00" titulo="Pelada da Quinta" horario="19:00"' 
    });
    
    await templateList.handle(mockFunctions);
    
    expect(mockFunctions.sendReply).toHaveBeenCalledWith(
      '\n*Pelada da Quinta*\n🏟 Local: Campo do Clube\n💵 Preço: R$ 20,00\n⏰ Horário: 19:00'
    );
  });

  it('should handle partial arguments', async () => {
    const mockFunctions = createMockCommonFunctions({ 
      fullArgs: 'titulo="Teste" local="Aqui"' 
    });
    
    await templateList.handle(mockFunctions);
    
    expect(mockFunctions.sendReply).toHaveBeenCalledWith(
      '\n*Teste*\n🏟 Local: Aqui\n💵 Preço: Não definido\n⏰ Horário: Não definido'
    );
  });
});