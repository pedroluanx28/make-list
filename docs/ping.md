# Ping 🏓🤖

O comando `ping` é uma ferramenta simples para testar a conectividade e responsividade do bot, confirmando que ele está online e funcionando corretamente.

## Descrição do Comando

Verifica se o bot está respondendo e funcionando adequadamente. É um comando básico de diagnóstico que retorna uma resposta imediata.

## Exemplos

**Uso básico:**
```
/ping
```

**Resposta esperada:**
```
🏓 (reação na mensagem)
Pong! 🏓
```

## Aliases

- `ping`

## Formatos dos Parâmetros

- **Comando**: `/ping`
- **Parâmetros**: Nenhum parâmetro é necessário ou aceito

## Como Funciona

1. **Recebimento**: O bot recebe o comando `/ping`
2. **Reação imediata**: Adiciona a reação de ping-pong (🏓) à mensagem original
3. **Resposta**: Envia a mensagem "Pong! 🏓" como resposta
4. **Confirmação**: O usuário confirma que o bot está online e responsivo

## Arquivos

- `src/commands/member/ping.ts` - Implementação principal do comando
- `src/@types/command.ts` - Definição do tipo Command

## Recursos Técnicos

- ✅ Resposta instantânea para teste de conectividade
- ✅ Reação visual imediata (🏓)
- ✅ Mensagem de confirmação clara
- ✅ Implementação minimalista e eficiente
- ✅ Sem dependências externas
- ✅ Funciona tanto em grupos quanto em conversas privadas
- ✅ Uso universal para diagnóstico rápido
- ✅ Padrão comum em sistemas de bot (ping/pong)