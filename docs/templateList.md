# Template de Lista 📝⚽

O comando `templatelist` (ou `racha`) permite criar templates personalizados para organizar eventos, especialmente rachas esportivos, com informações como local, valor, horário e título.

## Descrição do Comando

Gera um template formatado com campos personalizáveis para organização de eventos. Ideal para rachas esportivos, reuniões ou qualquer evento que precise de informações básicas organizadas.

## Exemplos

**Uso básico sem parâmetros:**
```
/racha
```
*Resultado:*
```
*Racha*
🏟 Local: Não definido
💵 Preço: Não definido  
⏰ Horário: Não definido
```

**Com parâmetros personalizados:**
```
/racha local="Campo do Botafogo" valor="R$ 20" titulo="Racha de Sábado" horario="14h às 16h"
```
*Resultado:*
```
*Racha de Sábado*
🏟 Local: Campo do Botafogo
💵 Preço: R$ 20
⏰ Horário: 14h às 16h
```

**Obtendo ajuda:**
```
/racha --help
```

## Aliases

- `racha`
- `templatelist`

## Formatos dos Parâmetros

Os parâmetros seguem o formato `chave="valor"` e são opcionais:

- **local**: Local do evento (ex: `local="Campo do Flamengo"`)
- **valor**: Preço por pessoa (ex: `valor="R$ 15"`)
- **titulo**: Título personalizado (ex: `titulo="Pelada de Domingo"`)
- **horario**: Horário do evento (ex: `horario="09h às 11h"`)
- **--help**: Mostra as variáveis disponíveis e exemplo de uso

**Regras de formatação:**
- Use aspas duplas (`"`) ou simples (`'`) para valores
- Separe múltiplos parâmetros com espaços
- Valores não definidos aparecem como "Não definido"

## Como Funciona

1. **Detecção de ajuda**: Se `--help` estiver presente, mostra as variáveis disponíveis
2. **Parsing de parâmetros**: Extrai parâmetros usando regex para formato `chave="valor"`
3. **Mapeamento de valores**: Mapeia os valores extraídos para as variáveis correspondentes
4. **Geração do template**: Cria o template formatado com emojis e campos organizados
5. **Valores padrão**: Usa "Não definido" para campos não preenchidos e "Racha" como título padrão

## Arquivos

- `src/commands/member/templateList.ts` - Implementação principal do comando
- `src/@types/command.ts` - Definição do tipo Command

## Recursos Técnicos

- ✅ Sistema de parsing flexível com regex
- ✅ Suporte a aspas duplas e simples nos valores
- ✅ Comando de ajuda integrado (`--help`)
- ✅ Valores padrão para campos não preenchidos
- ✅ Template formatado com emojis para visual atrativo
- ✅ Validação automática de formato de parâmetros
- ✅ Interface intuitiva para criação rápida de eventos
- ✅ Suporte a múltiplos aliases para facilitar o uso
- ✅ Sistema de tipos TypeScript para segurança