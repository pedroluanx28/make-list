# Marcar Todos 📢👥

O comando `markall` permite marcar (mencionar) todos os membros de um grupo de uma só vez, útil para fazer anúncios importantes ou chamar a atenção de todos os participantes.

## Descrição do Comando

Menciona todos os membros ativos de um grupo do WhatsApp, enviando uma mensagem de atenção seguida de uma mensagem personalizada opcional.

## Exemplos

**Uso básico:**
```
/markall
```

**Com mensagem personalizada:**
```
/markall Reunião importante às 15h, presença obrigatória!
```

**Usando aliases:**
```
/all Não esqueçam da festa amanhã!
/todes Lembrete: prazo final hoje!
```

## Aliases

- `markall`
- `all`  
- `todes`

## Formatos dos Parâmetros

- **Comando**: `/markall` ou qualquer um dos aliases
- **Mensagem opcional**: Qualquer texto após o comando será enviado como mensagem adicional
- **Limitação**: Funciona apenas em grupos (não em conversas privadas)

## Como Funciona

1. **Verificação de grupo**: Confirma se o comando está sendo usado em um grupo
2. **Obtenção de participantes**: Busca a lista de todos os membros do grupo
3. **Criação de menções**: Gera menções (@) para cada membro ativo
4. **Envio da mensagem principal**: Envia "📢 *ATENÇÃO*" seguido da lista de menções
5. **Mensagem personalizada**: Se fornecida, envia a mensagem adicional do usuário
6. **Reação**: Adiciona uma reação à mensagem original

## Arquivos

- `src/commands/member/markAll.ts` - Implementação principal do comando
- `src/@types/command.ts` - Definição do tipo Command

## Recursos Técnicos

- ✅ Verificação automática se está em grupo
- ✅ Obtenção dinâmica da lista de participantes
- ✅ Sistema de menções nativo do WhatsApp
- ✅ Suporte a múltiplos aliases para facilitar o uso
- ✅ Mensagem personalizada opcional
- ✅ Reação automática para confirmação visual
- ✅ Tratamento de erro quando não consegue obter participantes
- ✅ Formatação clara com emoji de atenção
- ✅ Prevenção de uso em conversas privadas