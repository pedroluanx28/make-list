# Poker 🃏🤖

O comando `poker` conduz uma mesa de Texas Hold'em no grupo: o bot distribui as cartas no privado de cada jogador, controla as apostas e, quando a mesa acaba, envia o resumo de quanto cada um ganhou ou perdeu.

## Descrição do Comando

Qualquer membro pode abrir uma mesa, entrar e jogar. Iniciar e encerrar a mesa são permitidos a quem está sentado nela ou a um admin do grupo. Funciona só em grupos; no privado, apenas `.poker ajuda` responde.

O comando aceita os prefixos `.` e `/` (`.poker` e `/poker` funcionam igual).

## Exemplos

**Abrir uma mesa com mínimo de R$ 0,10 (padrão) e entrar:**
```
.poker abrir
.poker entrar Pedro 20
.poker entrar Ana 20
.poker iniciar
```

**Resposta esperada no grupo ao iniciar:**
```
🤖 🃏 Distribuindo cartas...
🤖 Mesa iniciada!
Small blind: Pedro (R$ 0,05) · Big blind: Ana (R$ 0,10)

@Pedro começa!
.poker call → pagar R$ 0,05
.poker raise [valor] → aumentar a aposta para [valor] (padrão: o dobro, R$ 0,20; mínimo R$ 0,20)
.poker fold → desistir da mão
.poker allin → apostar todas as suas fichas (R$ 20,00)

Pote: R$ 0,15
```

**No privado de cada jogador:** as imagens das duas cartas e o texto `🤖 🃏 Suas cartas na mão 1: [10♥️] [6♥️]`.

**Consultar o próprio saldo:**
```
.poker saldo
```
```
🤖 💰 *Saldo de Pedro*
Fichas: R$ 12,40
Buy-in: R$ 10,00
Saldo: +R$ 2,40
```

**Resumo ao fim da mesa:**
```
🤖 🏁 *Mesa encerrada!*
🏆 Pedro ficou com todas as fichas!

Pedro: buy-in R$ 20,00 → R$ 40,00 (+R$ 20,00)
Ana: buy-in R$ 20,00 → R$ 0,00 (-R$ 20,00)
```

## Aliases

- `poker`

## Formatos dos Parâmetros

- **`.poker abrir [mínimo]`**: abre a mesa. O mínimo é o big blind (padrão `0.10`); o small blind é a metade, arredondada para baixo.
- **`.poker entrar <nome> <buy-in>`**: o nome é uma palavra de até 20 caracteres, único na mesa; o buy-in vai de 10 a 200 vezes o mínimo da mesa (com o mínimo padrão de R$ 0,10: de R$ 1,00 a R$ 20,00; com `.poker abrir 10`: de R$ 100,00 a R$ 2000,00).
- **`.poker iniciar`**: distribui as cartas e começa a mão (2 a 10 jogadores).
- **`.poker check`**: passa a vez sem apostar; só quando não há aposta para pagar.
- **`.poker call`**: paga a aposta atual; se faltar ficha, vira all-in.
- **`.poker raise [valor]`**: aumenta a sua aposta na rodada **para** `[valor]`. Sem valor, dobra a aposta atual. Quando ninguém apostou, abre a aposta (padrão: o mínimo da mesa).
- **`.poker fold`**: desiste da mão.
- **`.poker allin`**: aposta todas as suas fichas.
- **`.poker saldo`**: responde a quem digitou com as suas fichas, o buy-in e o saldo. Durante uma mão, mostra também quanto você já colocou no pote, que entra no saldo.
- **`.poker sair`**: sai da mesa sem encerrá-la. Antes de a mesa começar, só libera o lugar. Durante uma mão, é fold: o que você já apostou fica no pote, e o bot mostra o seu resultado (buy-in → fichas, saldo).
- **`.poker acabar`**: encerra a mesa e envia o resumo.
- **`.poker ajuda`**: lista os comandos e as regras.
- **Valores**: em reais, com ponto ou vírgula (`0.10`, `0,10`, `50`).

## Como Funciona

1. **Lugares**: a ordem de entrada define os lugares. Na 1ª mão, o 1º a entrar é o botão, o 2º o small blind e o 3º o big blind; a cada mão o botão anda um lugar no sentido horário. Com 2 jogadores, o botão é o small blind.
2. **Cartas**: a cada mão o bot compra um baralho novo e embaralhado na [Deck of Cards API](https://www.deckofcardsapi.com/) e manda as cartas no privado de cada jogador. Se a API falhar, a mão não começa e é só usar `.poker iniciar` de novo.
3. **Apostas**: os blinds são lançados sozinhos e o pré-flop começa à esquerda do big blind. Depois do flop, começa o primeiro jogador ativo à esquerda do botão. O flop, o turn e o river aparecem no grupo em texto, sempre com todas as cartas da mesa (o turn mostra 4 e o river mostra 5).
4. **Showdown**: o bot mostra as cartas de quem chegou ao fim, o nome da melhor mão de cada um e quem levou cada pote. Side pots são calculados quando alguém está all-in com menos fichas; empates dividem o pote.
5. **Tempo limite**: cada jogada tem 30 segundos, contados a partir da mensagem que marca o jogador da vez, e o relógio zera a cada troca de vez. Faltando 10 segundos, o bot marca o jogador. Quando o tempo acaba, o bot usa uma extensão de time bank (+30 s, com novo aviso aos 10 s). Cada jogador tem 3 extensões para a mesa inteira, sem recarga. Sem extensões, é fold automático, mesmo quando o check seria possível. Se o bot reiniciar no meio de uma mão, o jogador da vez ganha 30 segundos novos.
6. **Sair**: quem sai com `.poker sair` deixa de receber cartas e de jogar. No resumo final aparece marcado "(saiu)", com o resultado com que saiu. Se sobrar menos de 2 jogadores com fichas, a mesa acaba.
7. **Próxima mão**: começa automaticamente. Quem fica sem fichas sai das mãos seguintes.
8. **Fim**: a mesa acaba quando só um jogador tem fichas ou com `.poker acabar`. Uma mão em andamento é anulada e as apostas voltam para cada jogador que ainda está na mesa. O bot envia o resumo e apaga a mesa.

## Arquivos

- `src/commands/member/poker.ts` - Subcomandos, mensagens no grupo e cartas no privado
- `src/utils/pokerManager.ts` - Regras da mesa, side pots, showdown e persistência
- `src/utils/pokerHand.ts` - Avaliação das mãos e formatação das cartas
- `src/utils/deckOfCards.ts` - Cliente da Deck of Cards API
- `src/utils/pokerClock.ts` - Relógio da vez (aviso aos 10 s e fim do tempo)
- `src/utils/activeSocket.ts` - Conexão atual, usada pelos relógios mesmo depois de uma reconexão
- `tests/commands/member/poker.test.ts`, `tests/utils/poker*.test.ts`, `tests/utils/deckOfCards.test.ts`, `tests/loader.test.ts` - Testes

## Recursos Técnicos

- ✅ Estado da mesa em `assets/poker.json` (uma entrada por grupo), apagado quando a mesa acaba; a mesa continua depois de reiniciar o bot
- ✅ Comandos do mesmo grupo processados um por vez, para duas ações não se misturarem
- ✅ Valores guardados em centavos inteiros
- ✅ Raise mínimo, all-in incompleto que não reabre as apostas e side pots seguindo as regras oficiais
- ✅ Tempo limite de 30 s por jogada e time bank de 3 extensões de 30 s por jogador, com base no relógio da TDA e no shot clock do WSOP
- ✅ Sem histórico entre mesas
