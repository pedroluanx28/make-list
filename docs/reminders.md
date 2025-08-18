# Sistema de Lembretes 🤖⏰

O bot agora possui um sistema completo de lembretes que permite criar, listar e gerenciar lembretes personalizados.

## Comandos Disponíveis

### 1. Criar Lembrete
**Comando:** `/lembrete <tempo> <mensagem>`

**Exemplos:**
- `/lembrete 30min Reunião importante`
- `/lembrete 2h Tomar remédio`
- `/lembrete 1d Aniversário da mãe`
- `/lembrete 1w Revisão semanal`

**Formatos de tempo aceitos:**
- `min` - minutos (ex: 30min)
- `h` - horas (ex: 2h)
- `d` - dias (ex: 1d)
- `w` - semanas (ex: 1w)

### 2. Listar Lembretes
**Comando:** `/lembretes`

Mostra todos os seus lembretes ativos com:
- ID do lembrete
- Tempo restante
- Mensagem do lembrete

### 3. Deletar Lembrete
**Comando:** `/deletarlembrete <id>`

Remove um lembrete específico usando seu ID (obtido através do comando `/lembretes`).

## Como Funciona

1. **Criação:** Quando você cria um lembrete, ele é salvo em um arquivo JSON e agendado para execução
2. **Persistência:** Os lembretes são mantidos mesmo se o bot for reiniciado
3. **Notificação:** Quando o tempo chegar, o bot enviará a mensagem de lembrete no chat onde foi criado
4. **Limpeza:** Após ser executado, o lembrete é automaticamente removido

## Exemplos de Uso

```
/lembrete 15min Verificar email
/lembrete 1h Ligar para o cliente
/lembrete 1d Pagar contas
/lembretes
/deletarlembrete 1234567890
```

## Arquivos do Sistema

- `src/commands/member/reminder.ts` - Comando principal para criar lembretes
- `src/commands/member/listReminders.ts` - Comando para listar lembretes
- `src/commands/member/deleteReminder.ts` - Comando para deletar lembretes
- `src/utils/reminderManager.ts` - Gerenciador central de lembretes
- `assets/reminders.json` - Arquivo de armazenamento dos lembretes

## Recursos Técnicos

- ✅ Persistência de dados em JSON
- ✅ Recuperação automática após reinicialização
- ✅ Validação de formatos de tempo
- ✅ Sistema de IDs únicos
- ✅ Limpeza automática após execução
- ✅ Suporte a múltiplos usuários
- ✅ Mensagens de erro informativas
