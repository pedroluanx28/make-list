# Comandos 📋🤖

O comando `comandos` lista os comandos do bot que você pode usar, para descobrir o que o bot faz sem sair da conversa.

## Descrição do Comando

Responde com os comandos agrupados por permissão (**Membros**, **Admins** e **Dono**), mostrando só as seções que quem chamou pode executar. Qualquer membro pode usar, dentro ou fora de grupos; fora de grupo aparecem só os comandos de membro.

## Exemplos

**Uso básico (membro comum):**
```
/comandos
```

**Resposta esperada:**
```
🤖 📋 *Comandos disponíveis*

*Membros*
• /deletarlembrete <id> — Deletar um lembrete específico
• /markall — Marca todos os membros de um grupo
• /pedido <tempo_em_minutos> — Criar um pedido com enquete temporizada
• /ping — Verificar conexão com o bot
...
```

**Admin do grupo:** recebe também a seção
```
*Admins*
• /cardapio — Listar, adicionar, editar ou remover itens do cardápio do pedido
```

## Aliases

- `comandos`
- `ajuda`
- `help`

## Formatos dos Parâmetros

- **Comando**: `/comandos` (não recebe parâmetros)

## Como Funciona

1. **Leitura**: carrega os comandos das pastas `member`, `admin` e `owner`, os mesmos que o bot usa para responder
2. **Permissão**: cada seção só entra se quem chamou passaria no `checkPermission` daquele nível (admin ou dono do grupo para `Admins`, dono para `Dono`)
3. **Formatação**: uma linha por comando com a primeira linha do `usage` e a descrição; seções sem comandos não aparecem
4. **Resposta**: tudo vai numa única mensagem, como resposta à mensagem original

## Arquivos

- `src/commands/member/showCommands.ts` - Implementação principal do comando
- `tests/commands/member/showCommands.test.ts` - Testes

## Recursos Técnicos

- ✅ Lista gerada em tempo de execução: comando novo aparece sem editar nada aqui
- ✅ Filtra pela permissão de quem chamou, com a mesma regra do middleware de permissão
- ✅ Funciona no privado (mostra só os comandos de membro)
