# Poker Context

**Gathered:** 2026-10-28
**Spec:** `.specs/features/poker/spec.md`
**Status:** Ready for design (o spec ainda precisa ser adaptado ao formato completo da skill; ver `handoff.md`)

---

## Feature Boundary

Mesa de Texas Hold'em no-limit jogada num grupo do WhatsApp com comandos `.poker`: abrir, entrar, iniciar, ações de aposta, showdown, várias mãos até sobrar um jogador com fichas ou alguém digitar `.poker acabar`, resumo final e limpeza do estado. Cartas privadas vão no PV de cada jogador.

---

## Implementation Decisions

### Persistência

- Nada é armazenado depois da mesa. User: "por enquanto, não vamos poder armazenar resultado das partidas ou coisas assim, então enquanto a mesa acontece, as informações vão ficar salvas em algum arquivo dentro do próprio projeto, e serão limpos sempre que uma mesa acabar."

### Prefixo

- `.` e `/` passam a valer para todos os comandos. User escolheu: "Aceitar "/" e "." (Recommended)". Pedido original: "o prefixo será "." e não "/"".

### Comandos

- `.poker abrir [minimo]`: abre a mesa. User: "`.poker abrir <minimo>` (o default é 0.10 centavos)".
- `.poker entrar <nome> <buy in>`: user: "o jogador vai entrar na mesa com seu nome e seu buy in".
- `.poker iniciar`: inicia a primeira rodada.
- `.poker acabar`: encerra a mesa.
- `.poker ajuda`: user: "todos devem poder digitar .poker ajuda, esse comando vai retornar um texto explicando todos os comandos do poker."

### Posições

- User: "a ordem das jogadas vai ser definida por isso aqui também, por exemplo: entra o jogador 1 -> na primeira rodada ele vai ser o botão, o jogador 2 vai ser o small e o jogador 3 vai ser o big. Aí vai rodando no sentido horário, como no poker normalmente".

### Distribuição das cartas

- User: "quando iniciado, o bot vai mandar uma mensagem dizendo "distribuindo cartas" enquanto manda a mensagem no pv de todos os jogadores."
- User: "quero que você utilize uma API já existente de baralho: https://www.deckofcardsapi.com/"
- User: "quando for enviar as cartas no pv, você mande a imagem ou uma figurinha dessa imagem para o pv do jogador. O que for possível você faz. Se enviar imagem ou figurinha não for possível, você pode mandar apenas o texto, como nesse exemplo: "[10♥️] [6♥️] ""
- Decidido: imagem por carta + texto; figurinha fora (exige PNG→WebP).

### Blinds e ações

- User: "small blind e big blind vão automaticamente colocar metade do mínimo e o mínimo da mesa, então o jogo vai começar pelo jogador à esquerda do big blind."
- User: "call: ele paga a aposta anterior e passa para o próximo jogador".
- Raise: user: "jogador pode escolher o valor, mas se ele não preencher, o default vai ser o dobro da aposta anterior".
- Check: o user tinha descrito "ele sai do jogo"; foi explicado que isso é `fold` e que `check` é passar sem apostar. User aceitou a regra oficial: "certo, então pode dale".
- Ações finais: `check`, `call`, `raise [valor]`, `fold`, `allin` (fold e all-in foram sugeridos porque faltavam; user pediu "se eu estiver esquecendo alguma opção me lembre").
- User: "essas regras são todas do texas holdem, então basta pesquisá-las e adaptá-las aqui".

### Mensagens no grupo

- User: "no caso das cartas da mesa (flop, turn e river) você deve colocá-los em mensagem".
- Mensagem de início: "Mesa iniciada!\n@primeiro-jogador começa!" (o @ é a marcação do WhatsApp) e, logo abaixo, na mesma mensagem, uma linha por ação possível, ex.: "raise -> dobrar a aposta".

### Fim da mesa

- User: "Quando sobrar apenas um jogador com ficha E quando alguém digitar ".poker acabar", após isso, ele vai pegar todas as informações da mesa, por exemplo: com quanto cada um ficou etc e mandar o resumo em uma mensagem, após isso, ele apaga as informações dessa mesa do arquivo local".

### Agent's Discretion

Padrões propostos pelo agente na spec (linhas `n` da tabela de Assumptions), apresentados ao user para revisão e aceitos em "certo, então pode dale": formato `.poker <ação>`, leitura por `fullArgs`, nome de uma palavra, valores em centavos, arredondamento do small blind, buy-in ≥ mínimo, 2 a 10 jogadores, heads-up, semântica do raise ("aumentar para"; bet quando ninguém apostou), side pots, compra de todas as cartas numa chamada, próxima mão automática, eliminação, anulação da mão no `.poker acabar`, quem pode iniciar/acabar, retomada após reinício, comandos só em grupo.

### Declined / Undiscussed Gray Areas → Assumptions

Nenhuma área recusada. A varredura das dimensões implícitas (concorrência, falha da API externa, observabilidade etc.) ainda não foi feita no formato da skill; ver `handoff.md`.

---

## Specific References

- Deck of Cards API: https://www.deckofcardsapi.com/ ; imagens em `https://deckofcardsapi.com/static/img/<code>.png` (ex.: `6H.png`).

---

## Deferred Ideas

- Histórico/ranking de partidas (user: "por enquanto, não vamos poder armazenar resultado das partidas").
