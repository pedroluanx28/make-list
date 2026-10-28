# Mesa de poker (Texas Hold'em) — Especificação

**Approved**: 2026-10-28 - user: "certo, entao pode dale"
**Approved** (alteração POKER-14, buy-in mínimo): 2026-10-28 - user: "o minimo de buy in deve ser valor inicial da mesa x 10"
**Approved** (alteração POKER-13..15): 2026-10-28 - user: "melhorias: deixar todas as cartas visiveis nas proximas mensagens (flop, turn e river); criar comando "poker saldo" para mostrar o saldo atual do jogador que digitou; Limitar o buy in (ele pode pegar de buy in inciial ate 200 vezes o valor da aposta minima definida no comando de iniciar)"

## Problem Statement

O grupo quer jogar Texas Hold'em pelo WhatsApp sem app externo: alguém abre uma mesa, os jogadores entram com um buy-in, o bot distribui as cartas no privado de cada um, conduz as rodadas de aposta no grupo e, no fim, manda um resumo de quanto cada um ganhou ou perdeu. Nada fica guardado depois que a mesa acaba.

## Goals

- [ ] Um grupo joga uma mesa completa de Texas Hold'em (várias mãos, botão girando) só com comandos `.poker`.
- [ ] Cada jogador recebe suas cartas no privado; ninguém do grupo vê as cartas dos outros antes do showdown.
- [ ] Ao fim da mesa o grupo recebe um resumo com o resultado de cada jogador, e o estado da mesa é apagado.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Histórico/ranking entre mesas | Decisão do usuário: nada é armazenado depois que a mesa acaba |
| Entrar depois que a mesa foi iniciada, rebuy, sair no meio | Não pedido; `.poker acabar` encerra a mesa para todos |
| Tempo limite por jogada | Não pedido; a mesa espera o jogador da vez |
| Outras variantes (Omaha etc.), ante, limite de aposta | Só Texas Hold'em no-limit foi pedido |
| Dinheiro real / integração de pagamento | Os valores são só contagem de fichas em reais |
| Figurinha (sticker) das cartas | Exige converter PNG → WebP; a imagem resolve o mesmo problema (ver Assumptions) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Variante | Texas Hold'em no-limit | Decisão do usuário | y |
| Prefixo | O bot passa a aceitar `/` e `.` em **todos** os comandos | Decisão do usuário; nada quebra para quem já usa `/pedido` | y |
| Formato dos comandos | Um único comando `poker` com subcomandos: `.poker abrir`, `.poker entrar`, `.poker call` etc. | Decisão do usuário (`.poker abrir`, `.poker entrar`…); estendido às ações para não criar aliases curtos (`.call`, `.check`) que roubariam inputs de outros comandos | n |
| Leitura dos argumentos | Pelo `fullArgs` separado por espaços, não pelo `args` (que separa por `\`, `\|`, `/`) | `.poker entrar Pedro 50` chega como um único `arg` hoje | n |
| Nome do jogador | Uma palavra, até 20 caracteres, único na mesa (sem diferenciar maiúsculas) | O último argumento é o buy-in; nome com espaço ficaria ambíguo | n |
| Valores | Em reais com até 2 casas decimais (`0.10`, `0,10` e `50` aceitos); guardados internamente em centavos inteiros | Decisão do usuário (default 0.10); centavos evitam erro de ponto flutuante | n |
| Mínimo da mesa | `.poker abrir [minimo]` define o big blind; default `0.10` | Decisão do usuário | y |
| Small blind | Metade do mínimo, arredondada para baixo em centavos (mínimo 0.15 → small 0.07) | Decisão do usuário ("metade do mínimo"); arredondamento para baixo é o mais comum | n (arredondamento) |
| Buy-in | De 10 a 200 vezes o mínimo da mesa (com o padrão 0.10: de R$ 1,00 a R$ 20,00) | Mínimo: user: "o minimo de buy in deve ser valor inicial da mesa x 10". Máximo: pedido do usuário ("até 200 vezes o valor da aposta mínima"); o mínimo é o definido no `.poker abrir` | y |
| Jogadores | De 2 a 10 por mesa; uma mesa por grupo | 10 é o máximo de uma mesa real; 2·10 + 5 = 25 cartas cabem no baralho | n |
| Posições | Ordem de entrada define os assentos; na 1ª mão o 1º a entrar é o botão, o 2º small, o 3º big; depois gira no sentido horário (próximo assento) | Decisão do usuário | y |
| Heads-up (2 jogadores) | Botão é o small blind e age primeiro no pré-flop; o outro é o big blind | Regra oficial do Texas Hold'em | n |
| Quem age primeiro | Pré-flop: jogador à esquerda do big blind. Flop, turn, river: primeiro jogador ativo à esquerda do botão | Decisão do usuário (pré-flop) + regra oficial | y (pré-flop) |
| Ações | `check`, `call`, `raise [valor]`, `fold`, `allin` | Pedido do usuário + `fold` e `allin`, que faltavam; `check` **não** sai da mão (isso é `fold`) | n |
| `check` | Só quando não há aposta a pagar na rodada; passa a vez sem apostar | Regra oficial | n |
| `raise [valor]` | `valor` = total da aposta do jogador na rodada ("aumentar para"). Sem valor = dobro da aposta atual. Mínimo = aposta atual + último aumento. Quando ninguém apostou na rodada, funciona como aposta inicial (bet), com mínimo e default iguais ao mínimo da mesa | Decisão do usuário (valor opcional, default dobro) + regra oficial do mínimo; o dobro sempre satisfaz o mínimo | n (semântica "aumentar para" e bet) |
| `allin` | Aposta todas as fichas; se não alcança o mínimo de raise, não reabre a rodada para quem já agiu | Regra oficial | n |
| Side pots | Calculados quando alguém está all-in com menos fichas que os outros | Necessário para all-in funcionar corretamente | n |
| Baralho | Deck of Cards API (`deckofcardsapi.com`): um baralho novo embaralhado por mão, e todas as cartas da mão (2 por jogador + 5 da mesa) são compradas numa única chamada no início e guardadas no arquivo | Decisão do usuário (usar a API); comprar tudo de uma vez reduz chamadas de rede e falhas no meio da mão | n |
| Cartas no privado | Uma imagem por carta (`https://deckofcardsapi.com/static/img/<code>.png`), seguida de uma mensagem de texto `[10♥️] [6♥️]`; se o envio da imagem falhar, manda só o texto | Decisão do usuário: imagem se possível, texto como alternativa. O Baileys envia imagem por URL | n |
| Cartas da mesa (flop, turn, river) | Mensagem de texto no grupo, no formato `[A♠️] [K♦️] [7♣️]`, sempre com todas as cartas da mesa (turn mostra 4, river mostra 5) | Decisão do usuário ("deixar todas as cartas visíveis nas próximas mensagens") | y |
| `.poker saldo` | Responde só a quem digitou: fichas atuais, buy-in, saldo (fichas + o que está no pote nesta mão − buy-in) e, durante uma mão, quanto já está no pote | Pedido do usuário ("mostrar o saldo atual do jogador que digitou"); as fichas no pote ainda não são ganho nem perda | n |
| Avaliação das mãos | Melhor combinação de 5 entre as 7 cartas; empate divide o pote; centavo que sobrar vai para o primeiro vencedor à esquerda do botão | Regra oficial | n |
| Próxima mão | Começa automaticamente depois do showdown, com o botão no próximo jogador que ainda tem fichas | Decisão do usuário (mesa só acaba quando sobra 1 com fichas) | n |
| Jogador sem fichas | Eliminado: não recebe cartas nas mãos seguintes, mas aparece no resumo final | Necessário para "sobrar 1 jogador com fichas" | n |
| Fim da mesa | Quando só 1 jogador tem fichas **ou** alguém envia `.poker acabar` | Decisão do usuário | y |
| Resumo final | Para cada jogador: nome, buy-in, fichas finais e saldo (+/-); depois apaga a mesa do arquivo | Decisão do usuário | y |
| `.poker acabar` no meio de uma mão | A mão é anulada: as apostas dessa mão voltam para quem apostou antes do resumo | Ninguém ganhou aquela mão; é a forma mais justa | n |
| Quem pode `iniciar` / `acabar` | Qualquer jogador sentado na mesa, ou um admin do grupo | Evita que alguém de fora encerre a mesa; admin destrava mesa abandonada | n |
| Persistência | Estado da mesa em `assets/poker.json`, com uma entrada por grupo; a entrada é removida quando a mesa acaba | Decisão do usuário (arquivo dentro do projeto, limpo ao fim); mesmo padrão de `assets/reminders.json` | y |
| Reinício do bot | A mesa continua de onde parou ao recarregar o arquivo | É o motivo de guardar em arquivo e não em memória | n |
| Onde os comandos funcionam | Só em grupo; no privado o bot responde com aviso | A mesa pertence a um grupo; o privado só recebe cartas | n |
| Alias e nome do arquivo | Alias `poker`; arquivo `src/commands/member/poker.ts` | Alias único. Verificação de roteamento (`findCommandImport` sobre `dist/`, antes/depois, todos os inputs de 1-2 caracteres + prefixos de `poker`): nenhum input existente muda de destino; `po`, `pok`, `poke`, `ok`, `ke`, `oker` antes não acionavam nada e passam a ir para `poker` | n |

Os itens marcados `n` foram apresentados ao usuário para revisão em 2026-10-28 e aceitos na aprovação acima.

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Montar a mesa ⭐ MVP

**User Story**: Como participante do grupo, quero abrir uma mesa e entrar nela com meu nome e buy-in, para começar um jogo.

**Acceptance Criteria**:

1. WHEN alguém envia `.poker abrir [minimo]` num grupo sem mesa THEN o bot SHALL criar a mesa com big blind `minimo` (default `0.10`) e small blind igual à metade, e responder com os blinds e como entrar.
2. IF já existe mesa no grupo THEN `.poker abrir` SHALL ser recusado com aviso.
3. IF `minimo` não é um valor positivo com até 2 casas decimais THEN o bot SHALL recusar com `InvalidParameterError`.
4. WHEN alguém envia `.poker entrar <nome> <buyin>` numa mesa ainda não iniciada THEN o bot SHALL sentá-lo no próximo assento e responder com a lista de jogadores na ordem dos assentos.
5. IF a pessoa já está na mesa, o nome já é usado, o buy-in é inválido ou fora do intervalo permitido, a mesa está cheia (10) ou já foi iniciada THEN `.poker entrar` SHALL ser recusado com aviso explicando o motivo.

### P1: Distribuir as cartas e iniciar ⭐ MVP

**User Story**: Como jogador, quero que o bot distribua as cartas no meu privado e diga no grupo quem começa e o que pode fazer.

**Acceptance Criteria**:

1. WHEN um jogador sentado (ou admin) envia `.poker iniciar` com 2+ jogadores THEN o bot SHALL mandar no grupo `Distribuindo cartas...`.
2. The bot SHALL comprar as cartas da mão na Deck of Cards API e mandar a cada jogador, no privado, suas 2 cartas como imagem, seguidas de uma mensagem de texto `[X] [Y]`.
3. IF o envio de uma imagem falhar THEN o bot SHALL mandar ao jogador só o texto das cartas.
4. The bot SHALL lançar automaticamente o small blind e o big blind conforme as posições (incluindo a regra de heads-up).
5. WHEN todas as cartas foram enviadas THEN o bot SHALL mandar no grupo uma mensagem com `Mesa iniciada!`, a marcação do jogador da vez (`@jogador começa!`) e, abaixo, uma linha por ação que ele pode fazer agora (ex.: `call → pagar 0.10`, `raise [valor] → aumentar (padrão: 0.20)`, `fold → desistir da mão`, `allin → apostar tudo`).
6. IF há menos de 2 jogadores ou a mesa já foi iniciada THEN `.poker iniciar` SHALL ser recusado com aviso.
7. IF a Deck of Cards API falhar THEN o bot SHALL avisar no grupo e não iniciar a mão (blinds não são lançados).

### P1: Rodadas de aposta ⭐ MVP

**User Story**: Como jogador da vez, quero apostar, pagar, passar ou desistir, seguindo as regras do Texas Hold'em.

**Acceptance Criteria**:

1. WHEN o jogador da vez envia `.poker check|call|raise [valor]|fold|allin` válida THEN o bot SHALL aplicar a ação e anunciar no grupo o que aconteceu, o pote e a marcação do próximo jogador com as ações que ele pode fazer.
2. IF quem envia a ação não é o jogador da vez (ou não está na mão) THEN o bot SHALL recusar com aviso, sem alterar a mesa.
3. IF a ação não é permitida agora (`check` com aposta a pagar; `raise` abaixo do mínimo ou acima das fichas) THEN o bot SHALL recusar com aviso explicando o motivo.
4. IF o jogador não tem fichas para pagar o `call` inteiro THEN o `call` SHALL virar all-in com o que ele tem.
5. WHEN todos os jogadores ativos igualaram a maior aposta (ou estão all-in) e todos agiram THEN a rodada SHALL acabar e o bot SHALL abrir a próxima: flop (3 cartas), turn (1), river (1), mandando as cartas da mesa no grupo em texto `[A♠️] [K♦️] [7♣️]`.
6. IF todos menos um deram fold THEN o jogador restante SHALL ganhar o pote sem mostrar as cartas.
7. IF só um jogador (ou nenhum) ainda pode apostar porque os outros estão all-in THEN o bot SHALL revelar as cartas da mesa que faltam sem novas rodadas de aposta.

### P1: Showdown e próximas mãos ⭐ MVP

**User Story**: Como jogador, quero saber quem ganhou cada mão e seguir jogando até sobrar um.

**Acceptance Criteria**:

1. WHEN o river termina com 2+ jogadores na mão THEN o bot SHALL mostrar no grupo as cartas de cada um, o nome da melhor mão (Carta alta, Par, Dois pares, Trinca, Sequência, Flush, Full house, Quadra, Straight flush, Royal flush) e quem ganhou cada pote.
2. The bot SHALL dividir os potes (principal e side pots) entre os vencedores de cada um; em empate, dividir igualmente.
3. WHEN a mão termina e 2+ jogadores têm fichas THEN o bot SHALL girar o botão e iniciar a próxima mão automaticamente (mesmo fluxo de distribuição de cartas).
4. Jogadores sem fichas SHALL ficar de fora das mãos seguintes.

### P1: Encerrar a mesa ⭐ MVP

**User Story**: Como grupo, quero ver o resultado de todos quando a mesa acaba.

**Acceptance Criteria**:

1. WHEN só um jogador tem fichas THEN o bot SHALL encerrar a mesa.
2. WHEN um jogador sentado ou admin envia `.poker acabar` THEN o bot SHALL encerrar a mesa; se houver mão em andamento, as apostas dela voltam para quem apostou.
3. WHEN a mesa é encerrada THEN o bot SHALL mandar no grupo um resumo com, para cada jogador, nome, buy-in, fichas finais e saldo (+/-), e SHALL remover a mesa do grupo de `assets/poker.json`.
4. IF não há mesa ou quem envia `.poker acabar` não é jogador nem admin THEN o bot SHALL recusar com aviso.

### P1: Melhorias pedidas no teste

**Acceptance Criteria**:

1. WHEN o turn é revelado THEN o bot SHALL mostrar no grupo as 4 cartas da mesa.
2. WHEN o river é revelado THEN o bot SHALL mostrar no grupo as 5 cartas da mesa.
3. IF o buy-in de `.poker entrar` é maior que 200 vezes o mínimo da mesa THEN o bot SHALL recusar com `InvalidParameterError` informando o máximo.
3a. IF o buy-in de `.poker entrar` é menor que 10 vezes o mínimo da mesa THEN o bot SHALL recusar com `InvalidParameterError` informando o mínimo.
4. WHEN a mesa é aberta THEN o bot SHALL informar o buy-in mínimo e máximo.
5. WHEN um jogador sentado envia `.poker saldo` THEN o bot SHALL responder (reply) com o nome, as fichas atuais, o buy-in e o saldo (fichas − buy-in).
6. WHILE uma mão está em andamento, WHEN um jogador que já colocou fichas no pote envia `.poker saldo` the bot SHALL mostrar esse valor separado e somá-lo às fichas no cálculo do saldo.
7. IF quem envia `.poker saldo` não está na mesa THEN o bot SHALL recusar com aviso.

### P2: Ajuda

**Acceptance Criteria**:

1. WHEN qualquer pessoa envia `.poker ajuda` (ou `.poker` sem subcomando) THEN o bot SHALL responder com um texto explicando todos os subcomandos e ações, com e sem mesa aberta.

### P2: Prefixo `.`

**Acceptance Criteria**:

1. The bot SHALL aceitar `.` e `/` como prefixo de todos os comandos (`.ping` e `/ping` funcionam igual).
2. Mensagens que não começam com `.` ou `/` SHALL continuar sendo ignoradas.

---

## Edge Cases

- WHEN um subcomando desconhecido é enviado (`.poker xyz`) THEN o bot SHALL responder com aviso e indicar `.poker ajuda`.
- WHEN o bot reinicia no meio de uma mesa THEN a mesa SHALL continuar a partir de `assets/poker.json`, e o próximo comando válido segue normalmente.
- WHEN `assets/poker.json` não existe ou está corrompido THEN o bot SHALL tratar como nenhuma mesa aberta.
- WHEN um jogador é eliminado e era o próximo botão THEN o botão SHALL ir para o próximo jogador com fichas.
- WHEN um jogador sem fichas suficientes para o blind é small/big THEN SHALL entrar all-in com o que tem.
- WHEN um valor tem vírgula (`0,50`) THEN SHALL ser lido como `0.50`.
- IF `.poker` é enviado no privado THEN o bot SHALL responder que o poker só funciona em grupo.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| POKER-01 | P1 Montar a mesa: AC 1-3 (abrir) | Specify | Pending |
| POKER-02 | P1 Montar a mesa: AC 4-5 (entrar) | Specify | Pending |
| POKER-03 | P1 Distribuir/iniciar: AC 1-3, 7 (cartas no privado, API) | Specify | Pending |
| POKER-04 | P1 Distribuir/iniciar: AC 4-6 (blinds, mensagem de início) | Specify | Pending |
| POKER-05 | P1 Rodadas: AC 1-4 (ações e validação) | Specify | Pending |
| POKER-06 | P1 Rodadas: AC 5-7 (fim de rodada, flop/turn/river, all-in) | Specify | Pending |
| POKER-07 | P1 Showdown: AC 1-2 (avaliação, side pots, empate) | Specify | Pending |
| POKER-08 | P1 Showdown: AC 3-4 (próxima mão, eliminação) | Specify | Pending |
| POKER-09 | P1 Encerrar: AC 1-4 (fim, resumo, limpeza do arquivo) | Specify | Pending |
| POKER-10 | P2 Ajuda | Specify | Pending |
| POKER-11 | P2 Prefixo `.` | Specify | Pending |
| POKER-12 | Edge cases | Specify | Pending |
| POKER-13 | Melhorias: AC 1-2 (mesa completa no turn/river) | Execute | Pending |
| POKER-14 | Melhorias: AC 3-4 (buy-in máximo) | Execute | Pending |
| POKER-15 | Melhorias: AC 5-7 (`.poker saldo`) | Execute | Pending |

**Coverage:** 15 total, 15 mapped, 0 unmapped

---

## Success Criteria

- [ ] Uma mesa de 3 jogadores vai do `.poker abrir` ao resumo final num grupo real, com cartas chegando no privado de cada um.
- [ ] Os blinds, a ordem de ação e o giro do botão batem com as regras oficiais, incluindo heads-up.
- [ ] Side pots e empates distribuem o pote corretamente (cobertos por testes).
- [ ] `assets/poker.json` não tem mais a mesa do grupo depois que ela acaba.
- [ ] `/comandos` e os demais comandos continuam funcionando com `/` e passam a funcionar com `.`.
- [ ] Nenhum input curto existente muda de destino por causa do alias `poker`, exceto os registrados nas Assumptions após a verificação de roteamento.
- [ ] 100% de cobertura em `src/commands/member/poker.ts`; `npm run build` e `npm test` passam.
