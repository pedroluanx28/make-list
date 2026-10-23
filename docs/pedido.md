# Pedido 🛒🤖

O comando `pedido` abre uma enquete com os itens do cardápio por um tempo definido. Quando o tempo acaba (ou alguém usa `/pedido-encerrar`), o bot envia o resumo dos itens e o total de cada pessoa.

## Descrição do Comando

Cria um pedido no grupo usando uma enquete do WhatsApp com múltipla escolha. Os itens e preços vêm do cardápio configurado com o `/cardapio`.

- **Um pedido por grupo**: enquanto houver um pedido aberto, um novo `/pedido` é recusado
- **Tempo**: de 1 a 1440 minutos (24 horas)
- **Votos**: cada pessoa pode marcar vários itens e mudar o voto até o encerramento; vale a última seleção
- **Encerramento manual**: `/pedido-encerrar` fecha o pedido antes do tempo e envia o resultado

## Exemplos

**Abrir um pedido de 30 minutos:**
```
/pedido 30
```
```
✅ Pedido criado! A enquete ficará aberta por 30 minutos.

Vote nos itens que deseja pedir! 🛒
```

**Resultado ao encerrar:**
```
📦 Pedido encerrado!

Resumo:
- cuscuz: 2
- pizza: 1
```
```
💰 Totais individuais:

@5511999999999 — R$ 13,00
@5511888888888 — R$ 7,00
```

**Encerrar antes do tempo:**
```
/pedido-encerrar
```

## Aliases

- Abrir: `pedido`, `lidineide`
- Encerrar: `pedido-encerrar`, `lidineide-encerrar`

## Formatos dos Parâmetros

- **Tempo**: número inteiro de minutos, maior que zero e até 1440. Ex.: `/pedido 45`

## Como Funciona

1. **Validação**: confere o tempo e reserva o grupo, para que dois `/pedido` enviados ao mesmo tempo não criem duas enquetes
2. **Enquete**: envia a enquete com os itens do cardápio e guarda uma cópia do cardápio no pedido
3. **Votos**: os votos chegam criptografados (`pollUpdateMessage`); o `onMessagesUpsert` repassa cada um ao `recordVote`, que os descriptografa com o JID do bot e do votante (número ou LID)
4. **Encerramento**: ao fim do tempo, ou com `/pedido-encerrar`, o bot envia o resumo por item e os totais por pessoa, marcando cada um

## Arquivos

- `src/commands/member/pedido.ts` - Abre o pedido
- `src/commands/member/pedidoEncerrar.ts` - Encerra o pedido manualmente
- `src/utils/pedidoManager.ts` - Pedidos ativos, votos e resumo
- `src/middlewares/onMessagesUpsert.ts` - Encaminha os votos da enquete
- `tests/commands/member/pedido.test.ts` - Testes

## Recursos Técnicos

- ✅ Enquete com múltipla escolha e tempo limite
- ✅ Totais individuais com menção de cada pessoa
- ✅ Votos descriptografados em grupos com número ou LID
- ⚠️ Pedidos ficam só em memória: se o bot reiniciar, o pedido aberto é perdido
