# Poker Tasks

**Design**: `.specs/features/poker/design.md`
**Status**: In Progress
**Approved**: não apresentado para revisão; o user mandou implementar direto - user: "certo, pode começar a codar!" (2026-10-28)
**Mutations**: 3
**Build**: `npm run build; npm test`
**Run engine**: `npx jest tests/utils/pokerManager.test.ts tests/utils/pokerHand.test.ts tests/utils/pokerClock.test.ts tests/utils/deckOfCards.test.ts --reporters=default --verbose`
**Run command**: `npx jest tests/commands/member/poker.test.ts --reporters=default --verbose`
**Run saldo**: `npx jest tests/commands/member/poker.test.ts -t "poker command saldo" --reporters=default --verbose`
**Run sair**: `npx jest tests/commands/member/poker.test.ts -t "poker command sair" --reporters=default --verbose`
**Run acabar**: `npx jest tests/commands/member/poker.test.ts -t "poker command acabar" --reporters=default --verbose`
**Run prefix**: `npx jest tests/utils/dynamicCommand.test.ts tests/utils/extractDataFromMessage.test.ts --reporters=default --verbose`

---

## Test Coverage Matrix

> Guidelines found: `CLAUDE.md` (100% de cobertura nos comandos, fs mockado, Baileys mockado), `jest.config.js`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Utils (motor, avaliação, API) | unit | Todos os ramos; 1:1 com os critérios | `tests/utils/*.test.ts` | `npx jest tests/utils` |
| Comando | unit | 100% do arquivo; todos os subcomandos e erros | `tests/commands/member/*.test.ts` | `npx jest tests/commands` |
| Middlewares/parsing | unit | Prefixos aceitos e recusados | `tests/utils`, `tests/middlewares` | `npx jest` |
| Docs | none | build gate | `docs/` | - |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após cada task com teste | `npx jest <arquivo de teste>` |
| Build | Fim de cada task | `npm run build && npm test` |

---

## Execution Plan

```
T1 → T2 → T3 → T4 → T5 → T6
```

## Task Breakdown

### T1: Prefixos `/` e `.` [x]
**Where**: `src/config.ts`, `src/middlewares/index.ts`, `src/utils/index.ts` · **Requirement**: POKER-11 · **Tests**: unit · **Gate**: build
**Commit**: `feat(prefixo): aceita "." além de "/" nos comandos`

### T2: Cliente da Deck of Cards API e formatação das cartas [x]
**Where**: `src/utils/deckOfCards.ts`, `src/utils/pokerHand.ts` (formatação) · **Requirement**: POKER-03 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): adiciona cliente da Deck of Cards API`

### T3: Avaliação das mãos [x]
**Where**: `src/utils/pokerHand.ts` · **Requirement**: POKER-07 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): avalia e compara mãos de Texas Hold'em`

### T4: Motor da mesa e persistência [x]
**Where**: `src/utils/pokerManager.ts` · **Requirement**: POKER-01, 02, 04, 05, 06, 07, 08, 09, 12 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): adiciona motor da mesa com side pots e persistência`

### T5: Comando `.poker` [x]
**Where**: `src/commands/member/poker.ts` · **Requirement**: POKER-01..10 · **Tests**: unit (100%) · **Gate**: build
**Commit**: `feat(poker): adiciona comando .poker`

### T6: Documentação [x]
**Where**: `docs/poker.md`, `docs/README.md`, `README.md` · **Requirement**: DoD · **Tests**: none · **Gate**: build
**Commit**: `docs(poker): documenta o comando .poker`

### T7: Mesa completa no turn e no river [x]
**Where**: `src/utils/pokerManager.ts`, `src/commands/member/poker.ts` · **Requirement**: POKER-13 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): mostra todas as cartas da mesa no turn e no river`

### T8: Buy-in máximo de 200 vezes o mínimo [x]
**Where**: `src/utils/pokerManager.ts`, `src/commands/member/poker.ts` · **Requirement**: POKER-14 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): limita o buy-in a 200 vezes o mínimo da mesa`

### T9: Comando `.poker saldo` [x]
**Where**: `src/commands/member/poker.ts`, `docs/poker.md` · **Requirement**: POKER-15 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): adiciona o subcomando saldo`

## Alteração POKER-16..18

**Approved** (alteração POKER-16..18): 2026-10-28 - user: "reseta sempre que mudar a vez / pode começar"

### T10: Time bank no motor [x]
**What**: campo `timeBank` (3 extensões) no jogador e `useTimeBank(table, jid)`.
**Where**: `src/utils/pokerManager.ts` · **Depends on**: None · **Requirement**: POKER-17 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): adiciona time bank de 3 extensões por jogador`

### T11: Saída da mesa no motor [x]
**What**: `leaveTable` (antes do início remove; na mão dá fold; marca `left`), quem saiu fora das próximas mãos e marcado no resumo.
**Where**: `src/utils/pokerManager.ts` · **Depends on**: T10 · **Requirement**: POKER-18 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): permite sair da mesa no motor`

### T12: Socket ativo compartilhado [x]
**What**: `setActiveSocket`/`getActiveSocket`, registrado pelo loader a cada socket.
**Where**: `src/utils/activeSocket.ts` · **Depends on**: None · **Requirement**: POKER-16 · **Tests**: unit · **Gate**: build
**Commit**: `feat(conexao): guarda o socket ativo para tarefas agendadas`

### T13: Relógio da vez [x]
**What**: `startClock`/`stopClock` com aviso aos 10 s restantes e fim do tempo.
**Where**: `src/utils/pokerClock.ts` · **Depends on**: None · **Requirement**: POKER-16 · **Tests**: unit (fake timers) · **Gate**: build
**Commit**: `feat(poker): adiciona o relógio da vez`

### T14: Tempo limite no comando [x]
**What**: linha do relógio na vez, liga/desliga o relógio, extensão ou fold por tempo, retomada após reinício.
**Where**: `src/commands/member/poker.ts`, `src/index.ts` · **Depends on**: T10, T12, T13 · **Requirement**: POKER-16, POKER-17 · **Tests**: unit (fake timers) · **Gate**: build
**Commit**: `feat(poker): aplica tempo limite e time bank na vez de cada jogador`

### T15: Subcomando `.poker sair` [x]
**What**: `sair` com resultado do jogador, vez passada adiante e encerramento quando sobra menos de 2.
**Where**: `src/commands/member/poker.ts` · **Depends on**: T11, T14 · **Requirement**: POKER-18 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): adiciona o subcomando sair`

### T16: Documentação [x]
**What**: ajuda do comando e `docs/poker.md` com tempo limite, time bank e `sair`.
**Where**: `docs/poker.md` · **Depends on**: T15 · **Requirement**: DoD · **Tests**: none · **Gate**: build
**Commit**: `docs(poker): documenta tempo limite, time bank e sair`

```
T10 → T11 → T12 → T13 → T14 → T15 → T16
```

---

## Checks

**C1** - `.poker abrir` sem valor cria a mesa com big blind R$ 0,10 e small R$ 0,05 e responde com os blinds (POKER-01, AC 1)
Proof: run command | ✓ should open a table with the default 0.10 minimum

**C2** - `.poker abrir <minimo>` usa o mínimo informado como big blind (POKER-01, AC 1)
Proof: run command | ✓ should open a table with the minimum given

**C3** - Um segundo `.poker abrir` no mesmo grupo é recusado (POKER-01, AC 2)
Proof: run command | ✓ should refuse a second table in the same group

**C4** - Um mínimo inválido é recusado com `InvalidParameterError` (POKER-01, AC 3)
Proof: run command | ✓ should refuse an invalid minimum

**C5** - Um valor com 3 casas decimais (`1.234`) é recusado (POKER-01, AC 3)
Proof: run engine | ✓ should reject "1.234"

**C6** - `.poker entrar` senta o jogador e lista todos na ordem dos assentos (POKER-02, AC 4)
Proof: run command | ✓ should seat the player and list everyone in seat order

**C7** - Quem já está na mesa não entra de novo (POKER-02, AC 5)
Proof: run engine | ✓ should refuse the same person twice

**C8** - Um nome já usado na mesa é recusado, sem diferenciar maiúsculas (POKER-02, AC 5)
Proof: run engine | ✓ should refuse a name already used, ignoring case

**C9** - O 11º jogador é recusado (POKER-02, AC 5)
Proof: run engine | ✓ should refuse an 11th player

**C10** - Ninguém entra depois que a mesa começou (POKER-02, AC 5)
Proof: run engine | ✓ should refuse a player once the table has started

**C11** - Um buy-in que não é valor (`abc`) é recusado (POKER-02, AC 5)
Proof: run engine | ✓ should reject "abc"

**C12** - `.poker iniciar` manda `Distribuindo cartas...`, as cartas no privado e depois quem começa (POKER-03, AC 1-2; POKER-04, AC 5)
Proof: run command | ✓ should announce the deal, send each player their cards in private and then who starts

**C13** - As cartas vêm de um baralho novo embaralhado, numa só requisição (POKER-03, AC 2)
Proof: run engine | ✓ should draw the requested number of cards from a new shuffled deck in one request

**C14** - Se a imagem de uma carta falha, o jogador recebe só o texto (POKER-03, AC 3)
Proof: run command | ✓ should send only the text when a card image fails

**C15** - Na 1ª mão o 1º jogador é o botão, o 2º o small e o 3º o big blind (POKER-04, AC 4)
Proof: run engine | ✓ should make the first player the button, the second the small blind and the third the big blind

**C16** - No heads-up o botão paga o small blind e age primeiro no pré-flop (POKER-04, AC 4)
Proof: run engine | ✓ should make the button the small blind and first to act preflop in heads-up

**C17** - `.poker iniciar` com menos de 2 jogadores é recusado (POKER-04, AC 6)
Proof: run command | ✓ should refuse to start with fewer than two players

**C18** - `.poker iniciar` com mão em andamento é recusado (POKER-04, AC 6)
Proof: run command | ✓ should refuse to start while a hand is in progress

**C19** - Se a Deck of Cards API falha, a mão não começa e nenhum blind é lançado (POKER-03, AC 7)
Proof: run command | ✓ should not start the hand when the deck API fails

**C20** - Uma ação válida é anunciada com o pote e a marcação do próximo jogador com as opções (POKER-05, AC 1)
Proof: run command | ✓ should announce the action and tag the next player with their options

**C21** - Uma ação fora da vez é recusada (POKER-05, AC 2)
Proof: run command | ✓ should refuse an action out of turn

**C22** - Uma ação de quem não está na mão é recusada (POKER-05, AC 2)
Proof: run engine | ✓ should refuse an action from someone not playing the hand

**C23** - `check` com aposta a pagar é recusado (POKER-05, AC 3)
Proof: run engine | ✓ should refuse a check when there is a bet to pay

**C24** - `raise` abaixo do mínimo é recusado (POKER-05, AC 3)
Proof: run engine | ✓ should refuse a raise below the minimum raise

**C25** - `raise` acima das fichas é recusado (POKER-05, AC 3)
Proof: run engine | ✓ should refuse a raise above the player chips

**C26** - Um `call` que o jogador não cobre vira all-in (POKER-05, AC 4)
Proof: run engine | ✓ should turn a call the player cannot cover into an all-in

**C27** - O flop abre com 3 cartas e o 1º jogador ativo à esquerda do botão (POKER-06, AC 5)
Proof: run engine | ✓ should open the flop with three board cards and the first active player left of the button

**C28** - Turn e river revelam uma carta cada (POKER-06, AC 5)
Proof: run engine | ✓ should reveal the turn and the river one card at a time

**C29** - Quando todos menos um dão fold, o restante leva o pote (POKER-06, AC 6)
Proof: run engine | ✓ should give the pot to the last player when everyone else folds

**C30** - Com todos all-in, o resto da mesa é revelado sem novas apostas (POKER-06, AC 7)
Proof: run engine | ✓ should reveal the remaining board without betting when everyone is all-in

**C31** - No showdown cada jogador ainda na mão tem a mão nomeada (POKER-07, AC 1)
Proof: run engine | ✓ should name the hand of each player still in at the showdown

**C32** - Uma categoria maior vence uma menor (POKER-07, AC 1)
Proof: run engine | ✓ should rank a higher category above a lower one

**C33** - Um all-in curto só ganha o pote principal (POKER-07, AC 2)
Proof: run engine | ✓ should split side pots so a short all-in only wins the main pot

**C34** - Um empate divide o pote e a ficha ímpar vai ao 1º vencedor à esquerda do botão (POKER-07, AC 2)
Proof: run engine | ✓ should split a tied pot and give the odd cent to the first winner left of the button

**C35** - Depois de uma mão com 2+ jogadores com fichas, a próxima é distribuída (POKER-08, AC 3)
Proof: run command | ✓ should give the pot on folds, show the chips and deal the next hand

**C36** - O botão gira e pula quem não tem fichas (POKER-08, AC 3-4)
Proof: run engine | ✓ should move the button clockwise and skip players without chips on the next hand

**C37** - Quando um jogador fica com todas as fichas, a mesa é encerrada (POKER-09, AC 1)
Proof: run command | ✓ should show the showdown and end the table when one player has all the chips

**C38** - `.poker acabar` anula a mão, manda o resumo e apaga a mesa (POKER-09, AC 2-3)
Proof: run acabar | ✓ should void the hand in progress, send the summary and delete the table

**C39** - Ao encerrar com mão em andamento, cada aposta volta para quem apostou (POKER-09, AC 2)
Proof: run engine | ✓ should give back every bet of a hand in progress

**C40** - O resumo traz buy-in, fichas finais e saldo de cada jogador (POKER-09, AC 3)
Proof: run engine | ✓ should report buy-in, final chips and balance of each player

**C41** - Um admin pode encerrar a mesa (POKER-09, AC 2)
Proof: run acabar | ✓ should let a group admin end a table before it starts

**C42** - `.poker acabar` sem mesa é recusado (POKER-09, AC 4)
Proof: run acabar | ✓ should refuse when there is no table

**C43** - `.poker acabar` de quem não é jogador nem admin é recusado (POKER-09, AC 4)
Proof: run acabar | ✓ should refuse someone who is neither at the table nor an admin

**C44** - O turn mostra as 4 cartas e o river as 5 (POKER-13, AC 1-2)
Proof: run command | ✓ should show the showdown and end the table when one player has all the chips

**C45** - Um buy-in acima de 200 vezes o mínimo é recusado (POKER-14, AC 3)
Proof: run engine | ✓ should refuse a buy-in above 200 times the table minimum

**C46** - Um buy-in de exatamente 200 vezes o mínimo é aceito (POKER-14, AC 3)
Proof: run engine | ✓ should accept a buy-in of exactly 200 times the table minimum

**C47** - Um buy-in abaixo de 10 vezes o mínimo é recusado (POKER-14, AC 3a)
Proof: run engine | ✓ should refuse a buy-in below 10 times the table minimum

**C48** - Um buy-in de exatamente 10 vezes o mínimo é aceito (POKER-14, AC 3a)
Proof: run engine | ✓ should accept a buy-in of exactly 10 times the table minimum

**C49** - `.poker saldo` responde com fichas, buy-in e saldo (POKER-15, AC 5)
Proof: run saldo | ✓ should reply with the chips, buy-in and balance of who asked

**C50** - Durante a mão, `.poker saldo` mostra o que está no pote e soma ao saldo (POKER-15, AC 6)
Proof: run saldo | ✓ should show what is in the pot and count it in the balance during a hand

**C51** - `.poker saldo` de quem não está na mesa é recusado (POKER-15, AC 7)
Proof: run saldo | ✓ should refuse someone who is not at the table

**C52** - A marcação da vez informa 30 s e as extensões restantes (POKER-16, AC 1)
Proof: run command | ✓ should announce the action and tag the next player with their options

**C53** - Faltando 10 s, o jogador da vez é marcado (POKER-16, AC 2)
Proof: run command | ✓ should tag the player when 10 seconds are left

**C54** - Faltando 10 s de uma extensão, o jogador é marcado de novo (POKER-16, AC 2)
Proof: run command | ✓ should warn again 10 seconds before an extension ends

**C55** - Sem jogada no tempo, uma extensão é gasta e a vez continua (POKER-17, AC 3)
Proof: run command | ✓ should spend a time bank extension when the time runs out and keep the turn

**C56** - Sem extensões, o jogador leva fold por tempo e a vez passa (POKER-16, AC 4)
Proof: run command | ✓ should fold the player when the time runs out with no extensions left and pass the turn

**C57** - O fold por tempo acontece mesmo quando o check era possível (POKER-16, AC 5)
Proof: run command | ✓ should fold even when a check was possible

**C58** - Jogar no tempo reinicia o relógio para o próximo jogador (POKER-16, AC 6)
Proof: run command | ✓ should start the clock over for the next player when someone acts in time

**C59** - As 3 extensões não recarregam na próxima mão (POKER-17, AC 7)
Proof: run engine | ✓ should not refill the extensions on the next hand

**C60** - Depois de reiniciar, o jogador da vez ganha 30 s novos (POKER-16, AC 8)
Proof: run command | ✓ should give the player to act a full turn again after a restart

**C61** - `.poker sair` antes do início libera o assento e lista quem ficou (POKER-18, AC 1)
Proof: run sair | ✓ should free the seat before the table starts and list who is still seated

**C62** - Quem sai fora da vez deixa as apostas no pote (POKER-18, AC 2)
Proof: run sair | ✓ should leave the bets in the pot and keep the clock of the player to act when someone else leaves

**C63** - Quem sai na própria vez leva fold, o resultado aparece e a vez passa (POKER-18, AC 3-4)
Proof: run sair | ✓ should fold the player to act, show the result and pass the turn with a new clock

**C64** - Quem saiu não recebe cartas, botão nem vez (POKER-18, AC 5)
Proof: run engine | ✓ should not deal cards, give the button or count chips of who left

**C65** - O resumo final lista quem saiu com o resultado (POKER-18, AC 6)
Proof: run engine | ✓ should list who left in the summary with their result

**C66** - Se sobra 1 jogador com fichas depois da saída, a mesa é encerrada (POKER-18, AC 7)
Proof: run sair | ✓ should end the table with everyone in the summary when only one player is left

**C67** - `.poker sair` de quem não está na mesa é recusado (POKER-18, AC 8)
Proof: run sair | ✓ should refuse someone who is not at the table

**C68** - `.poker ajuda` responde com o texto de ajuda (POKER-10, AC 1)
Proof: run command | ✓ should reply with the help text for "ajuda"

**C69** - `.poker` sem subcomando mostra a ajuda (POKER-10, AC 1)
Proof: run command | ✓ should show the help when the message has no arguments at all

**C70** - O prefixo `.` executa o comando (POKER-11, AC 1)
Proof: run prefix | ✓ should run the command when the prefix is "."

**C71** - Um prefixo diferente de `.` e `/` é ignorado (POKER-11, AC 2)
Proof: run prefix | ✓ should ignore the message when the prefix is "!" (a different prefix)

**C72** - Um subcomando desconhecido aponta para `.poker ajuda` (POKER-12)
Proof: run command | ✓ should point to the help for an unknown subcommand

**C73** - A mesa salva é lida de volta pelo grupo (sobrevive ao reinício) (POKER-12)
Proof: run engine | ✓ should save and load a table by group

**C74** - Um `assets/poker.json` corrompido conta como nenhuma mesa (POKER-12)
Proof: run engine | ✓ should treat corrupted JSON as no table

**C75** - Sem `assets/poker.json`, não há mesa (POKER-12)
Proof: run engine | ✓ should return null when there is no poker file

**C76** - Um big blind sem fichas suficientes entra all-in com o que tem (POKER-12)
Proof: run engine | ✓ should put a short big blind all-in with what is left

**C77** - `0,5` é lido como 50 centavos (POKER-12)
Proof: run engine | ✓ should read 0,5 as 50 cents

**C78** - No privado, subcomandos que não são ajuda são recusados (POKER-12)
Proof: run command | ✓ should refuse any other subcommand in a private chat

---

## Handoff

**Settled mid-build:** user: "certo, pode começar a codar!" - implementar sem revisar as tasks. T14 tocou também `src/utils/pokerManager.ts` (`getAllTables`, para retomar os relógios) e declarou `resumePokerClocks` depois de `poker`, porque o carregador usa o primeiro export.
**Dispatched:** Verifier (2026-11-04, HEAD 59b22dd, faixa b8f4944..59b22dd)
**Walked:** none
