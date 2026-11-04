# Poker verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 59b22dd
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `poker.test.ts` `should open a table with the default 0.10 minimum` | yes - fixa os blinds 0,05/0,10 na resposta e `minimum` 10 |
| C2 | `poker.test.ts` `should open a table with the minimum given` | yes |
| C3 | `poker.test.ts` `should refuse a second table in the same group` | yes |
| C4 | `poker.test.ts` `should refuse an invalid minimum` | yes - `InvalidParameterError` e nenhuma mesa salva |
| C5 | `pokerManager.test.ts` `should reject "1.234"` | yes |
| C6 | `poker.test.ts` `should seat the player and list everyone in seat order` | yes - texto exato |
| C7 | `pokerManager.test.ts` `should refuse the same person twice` | yes |
| C8 | `pokerManager.test.ts` `should refuse a name already used, ignoring case` | yes - `P0` contra `p0` |
| C9 | `pokerManager.test.ts` `should refuse an 11th player` | yes - nome, jid e buy-in válidos; só a lotação recusa |
| C10 | `pokerManager.test.ts` `should refuse a player once the table has started` | yes |
| C11 | `pokerManager.test.ts` `should reject "abc"` | yes |
| C12 | `poker.test.ts` `should announce the deal, send each player their cards in private and then who starts` | yes - ordem e conteúdo de todas as 11 mensagens |
| C13 | `deckOfCards.test.ts` `should draw the requested number of cards from a new shuffled deck in one request` | yes - 1 chamada a `new/draw/?count=3` |
| C14 | `poker.test.ts` `should send only the text when a card image fails` | yes |
| C15 | `pokerManager.test.ts` `should make the first player the button, the second the small blind and the third the big blind` | yes |
| C16 | `pokerManager.test.ts` `should make the button the small blind and first to act preflop in heads-up` | yes |
| C17 | `poker.test.ts` `should refuse to start with fewer than two players` | yes |
| C18 | `poker.test.ts` `should refuse to start while a hand is in progress` | yes |
| C19 | `poker.test.ts` `should not start the hand when the deck API fails` | yes - `started` false e fichas intactas |
| C20 | `poker.test.ts` `should announce the action and tag the next player with their options` | yes - texto exato e menção |
| C21 | `poker.test.ts` `should refuse an action out of turn` | yes |
| C22 | `pokerManager.test.ts` `should refuse an action from someone not playing the hand` | yes |
| C23 | `pokerManager.test.ts` `should refuse a check when there is a bet to pay` | yes |
| C24 | `pokerManager.test.ts` `should refuse a raise below the minimum raise` | yes |
| C25 | `pokerManager.test.ts` `should refuse a raise above the player chips` | yes |
| C26 | `pokerManager.test.ts` `should turn a call the player cannot cover into an all-in` | yes |
| C27 | `pokerManager.test.ts` `should open the flop with three board cards and the first active player left of the button` | yes |
| C28 | `pokerManager.test.ts` `should reveal the turn and the river one card at a time` | yes |
| C29 | `pokerManager.test.ts` `should give the pot to the last player when everyone else folds` | yes |
| C30 | `pokerManager.test.ts` `should reveal the remaining board without betting when everyone is all-in` | yes para "todos all-in"; a metade "só um jogador ainda pode apostar" do AC 7 não tem teste (mutação M2 viva) |
| C31 | `pokerManager.test.ts` `should name the hand of each player still in at the showdown` | yes |
| C32 | `pokerHand.test.ts` `should rank a higher category above a lower one` | yes |
| C33 | `pokerManager.test.ts` `should split side pots so a short all-in only wins the main pot` | yes - valores de cada pote e fichas finais (2 níveis; 3 níveis conferidos no exemplo E4) |
| C34 | `pokerManager.test.ts` `should split a tied pot and give the odd cent to the first winner left of the button` | yes - ficha ímpar no assento 2, não no 0 |
| C35 | `poker.test.ts` `should give the pot on folds, show the chips and deal the next hand` | yes |
| C36 | `pokerManager.test.ts` `should move the button clockwise and skip players without chips on the next hand` | yes |
| C37 | `poker.test.ts` `should show the showdown and end the table when one player has all the chips` | yes |
| C38 | `poker.test.ts` `should void the hand in progress, send the summary and delete the table` | yes |
| C39 | `pokerManager.test.ts` `should give back every bet of a hand in progress` | yes |
| C40 | `pokerManager.test.ts` `should report buy-in, final chips and balance of each player` | yes |
| C41 | `poker.test.ts` `should let a group admin end a table before it starts` | yes |
| C42 | `poker.test.ts` `should refuse when there is no table` (acabar) | yes |
| C43 | `poker.test.ts` `should refuse someone who is neither at the table nor an admin` (acabar) | yes - mensagem e mesa mantida |
| C44 | `poker.test.ts` `should show the showdown and end the table when one player has all the chips` | yes - turn com 4 e river com 5 cartas no texto exato |
| C45 | `pokerManager.test.ts` `should refuse a buy-in above 200 times the table minimum` | yes - 2001 recusado com o máximo na mensagem |
| C46 | `pokerManager.test.ts` `should accept a buy-in of exactly 200 times the table minimum` | yes |
| C47 | `pokerManager.test.ts` `should refuse a buy-in below 10 times the table minimum` | yes - 99 recusado |
| C48 | `pokerManager.test.ts` `should accept a buy-in of exactly 10 times the table minimum` | yes |
| C49 | `poker.test.ts` `should reply with the chips, buy-in and balance of who asked` | yes |
| C50 | `poker.test.ts` `should show what is in the pot and count it in the balance during a hand` | yes |
| C51 | `poker.test.ts` `should refuse someone who is not at the table` (saldo) | yes para quem nunca sentou; quem saiu com `.poker sair` não é recusado (achado) |
| C52 | `poker.test.ts` `should announce the action and tag the next player with their options` | no - só testa o time bank cheio (3); trocar `timeBankLeft(...)` por `3` (M1) deixa tudo verde |
| C53 | `poker.test.ts` `should tag the player when 10 seconds are left` | yes |
| C54 | `poker.test.ts` `should warn again 10 seconds before an extension ends` | yes |
| C55 | `poker.test.ts` `should spend a time bank extension when the time runs out and keep the turn` | yes |
| C56 | `poker.test.ts` `should fold the player when the time runs out with no extensions left and pass the turn` | yes |
| C57 | `poker.test.ts` `should fold even when a check was possible` | yes |
| C58 | `poker.test.ts` `should start the clock over for the next player when someone acts in time` | yes |
| C59 | `pokerManager.test.ts` `should not refill the extensions on the next hand` | yes |
| C60 | `poker.test.ts` `should give the player to act a full turn again after a restart` | no - só olha a mensagem em 30 s; um relógio retomado com 20-29 s também passa (não verifica que nada acontece antes de 30 s) |
| C61 | `poker.test.ts` `should free the seat before the table starts and list who is still seated` | yes |
| C62 | `poker.test.ts` `should leave the bets in the pot and keep the clock of the player to act when someone else leaves` | yes |
| C63 | `poker.test.ts` `should fold the player to act, show the result and pass the turn with a new clock` | yes |
| C64 | `pokerManager.test.ts` `should not deal cards, give the button or count chips of who left` | yes |
| C65 | `pokerManager.test.ts` `should list who left in the summary with their result` | yes |
| C66 | `poker.test.ts` `should end the table with everyone in the summary when only one player is left` | yes |
| C67 | `poker.test.ts` `should refuse someone who is not at the table` (sair) | yes |
| C68 | `poker.test.ts` `should reply with the help text for "ajuda"` | yes |
| C69 | `poker.test.ts` `should show the help when the message has no arguments at all` | yes |
| C70 | `dynamicCommand.test.ts` `should run the command when the prefix is "."` | yes - `verifyPrefix` real, só `findCommandImport` mockado |
| C71 | `dynamicCommand.test.ts` `should ignore the message when the prefix is "!" (a different prefix)` | yes |
| C72 | `poker.test.ts` `should point to the help for an unknown subcommand` | yes |
| C73 | `pokerManager.test.ts` `should save and load a table by group` | yes |
| C74 | `pokerManager.test.ts` `should treat corrupted JSON as no table` | yes |
| C75 | `pokerManager.test.ts` `should return null when there is no poker file` | yes |
| C76 | `pokerManager.test.ts` `should put a short big blind all-in with what is left` | yes |
| C77 | `pokerManager.test.ts` `should read 0,5 as 50 cents` | yes |
| C78 | `poker.test.ts` `should refuse any other subcommand in a private chat` | yes |
| C79 | `pokerManager.test.ts` `should give back to who left the part of the bet nobody still in the hand could cover` | yes - adicionado na correção; falhava antes de 81b3455 (fichas [100, 0, 360]) |
| C80 | `pokerManager.test.ts` `should reveal the rest of the board when the exit leaves only one player able to bet` | yes - adicionado na correção; falhava antes de 515c466 e mata M2 |
| C81 | `poker.test.ts` `should play the hand out and deal the next one when the exit leaves only one player able to bet` | yes - adicionado na correção; falhava antes de 515c466 (1 compra de cartas em vez de 2) |
| C82 | `pokerManager.test.ts` `should reveal the remaining board without a new turn when the only player left to bet calls an all-in` | yes - adicionado na correção; mata M2 |
| C83 | `pokerManager.test.ts` `should let who has not acted yet raise after a short all-in` | yes - adicionado na correção; mata M3 |
| C84 | `poker.test.ts` `should refuse someone who already left the table` | yes - adicionado na correção; falhava antes de f335d98 |
| C85 | `pokerManager.test.ts` `should raise to the minimum when raise has no value` | yes - adicionado na correção; falhava antes de 295e1f6 (WarningError do raise mínimo) |
| C86 | `pokerManager.test.ts` `should announce the minimum as the default` | yes - adicionado na correção; falhava antes de 295e1f6 |

### Exemplos próprios (rodados em HEAD num `tests/tmp-verifier.test.ts` descartável, já apagado)

- **E1** (raise sem valor, POKER-05): mesa de 3, no flop um jogador com R$ 0,05 vai all-in abrindo abaixo do mínimo. O próximo envia `raise` sem valor: recusado com `O raise mínimo é para R$ 0,15.`, enquanto `getOptions` anuncia `padrão: o dobro, R$ 0,10; mínimo R$ 0,15`. **Quebra.**
- **E2** (AC 7 de POKER-06 + `sair` fora da vez): fichas [100, 200, 200]; p0 all-in no pré-flop, p1 e p2 pagam; no flop é a vez de p1 e p2 sai fora da vez. A mão continua no flop com p1 da vez, embora ninguém possa responder a uma aposta dele; se p1 deixar o tempo correr, leva fold e perde o pote para p0. **Quebra.**
- **E3** (side pots + `sair`): fichas [300, 60, 150]; p0 aumenta para 2,00, p1 all-in 0,60, p0 sai fora da vez, p2 paga all-in 1,50. Total de fichas antes 5,10, depois 4,60: os R$ 0,50 de p0 acima do maior all-in somem. **Quebra.**
- **E4** (side pots com 3 níveis de all-in: 30/60/100/100): potes 120/90/80 com os vencedores certos, nenhum centavo perdido. Passa.
- **E5** (`parseAmount`/mínimo nos limites): `0.01` vira 1 centavo e `abrir 0.01` é recusado (small blind 0); `0,02` aceito com small 0,01; `1,` e ` 1` recusados. Passa.
- **E6** (prefixo `.`, rodado sobre `dist/` com `extractDataFromMessage` + `findCommandImport`): `...ok` → Poker, `...e` e `...ta` → Deletar Lembrete, `...p` → Pedido. **Quebra** (ver achados).

### Mutations (3, todas revertidas com `git checkout --`)

| Mutação | Arquivo:linha | Testes rodados | Resultado |
| --- | --- | --- | --- |
| M1 - mostrar sempre `time bank: 3` em vez de `timeBankLeft(currentPlayer(table)!)` | `src/commands/member/poker.ts:179` | `poker.test.ts` (71) | viva - 71/71 verdes |
| M2 - `actors.length <= 1` → `actors.length === 0` (a aposta só acaba quando ninguém mais pode agir) | `src/utils/pokerManager.ts:454` | `pokerManager.test.ts` + `poker.test.ts` (157) | viva - 157/157 verdes |
| M3 - `else if (other.acted)` → `else` (all-in curto tira o raise também de quem ainda não agiu) | `src/utils/pokerManager.ts:352` | `pokerManager.test.ts` + `poker.test.ts` (157) | viva - 157/157 verdes |

O formato de `mutations.json` não está descrito na skill (a linha `**Mutations**` é legado), por isso as mutações ficam registradas aqui.

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Fichas somem quando quem sai fora da vez tinha apostado mais que todos os que ficaram na mão, todos all-in | E3: total 5,10 → 4,60; `src/utils/pokerManager.ts:508` monta os níveis só com os `contenders`, então o `committed` de um foldado acima do maior nível nunca entra em pote nenhum | em `buildPots`, somar ao último pote o que os foldados puseram acima do maior nível (ou devolver a aposta não paga antes do showdown); teste de conservação de fichas com `sair` fora da vez | 81b3455 - C79 |
| Com um só jogador capaz de apostar, a mão não corre sozinha depois de um `sair` fora da vez (AC 7 de POKER-06) e o jogador pode perder o pote por tempo | E2; `src/utils/pokerManager.ts:623-634` marca o fold e não chama `proceed`, então o jogador da vez continua devendo uma ação sem ninguém para responder | depois do fold fora da vez, se `actors.length <= 1` e o da vez já igualou a aposta, chamar `proceed(table)` para revelar o resto da mesa; teste com o cenário E2 | 515c466 - C80, C81 |
| A metade "só um jogador ainda pode apostar" do AC 7 de POKER-06 não tem teste | M2 viva (`pokerManager.ts:454`); em todos os testes de all-in todos acabam all-in (C30, C33, `should name the main and side pots`) | teste em que o maior stack paga um all-in menor e o board é revelado sem nova vez para ele | 515c466 - C82 |
| `raise` sem valor é recusado depois de um all-in curto que abriu a rodada abaixo do mínimo, e as opções anunciam um padrão menor que o mínimo | E1; `src/utils/pokerManager.ts:330-333` (`currentBet * 2` = 0,10) contra `minimumRaiseTo` = 0,15 (`:325-328`); a spec afirma que "o dobro sempre satisfaz o mínimo" | `defaultRaiseTo` = `max(currentBet * 2, minimumRaiseTo(table))`; teste do cenário E1 | 295e1f6 - C85, C86 |
| Regra de raise incompleto (só quem já agiu perde o direito de aumentar) não é fixada por teste | M3 viva (`pokerManager.ts:352`); o único teste (`should not let who already acted re-raise after a short all-in`) tem todos já tendo agido | teste com um jogador que ainda não agiu depois de um all-in curto e pode dar raise | dc3575b - C83 |
| C52 não prova que a mensagem mostra as extensões **restantes** | M1 viva (`poker.ts:179`); `poker.test.ts:309` só vê `time bank: 3 × 30s` | assertar `time bank: 2 × 30s` (ou 0) na marcação de um jogador que já gastou extensão | 074a1e9 - C52 |
| C60 não fixa os 30 s novos depois do reinício | `poker.test.ts:584-587` só avança 30 s e olha a última mensagem; um relógio de 20 s passa | assertar que nada é enviado em 29 999 ms e que o aviso de 10 s sai em 20 s | 074a1e9 - C60 |
| Mensagens comuns começando com reticências disparam comandos por casamento parcial depois do prefixo `.` | E6 sobre `dist/`: `...ok` → poker, `...e`/`...ta` → deleteReminder, `...p` → pedido; `src/utils/index.ts:63-66` remove qualquer sequência de `.` e `COMMAND_MATCHERS` (`:133-137`) aceita `startsWith`/`includes`; a verificação de roteamento da spec só cobriu `/` | com o prefixo `.`, exigir um único `.` seguido de letra e casar só o alias exato (ou só `startsWith`); teste em `extractDataFromMessage`/`dynamicCommand` para `...ok` e `...e ai` | 73bdb35 (branch `fix/prefixo-e-permissao`) - `findCommandImport.test.ts`, `extractDataFromMessage.test.ts` |
| `.poker saldo` de quem já saiu da mesa responde com o saldo em vez de recusar (AC 7 de POKER-15) | `src/commands/member/poker.ts:378` busca o jogador sem olhar `left`, enquanto `leaveTable` (`pokerManager.ts:613`) e `requireManager` (`poker.ts:99`) tratam quem saiu como fora da mesa | recusar com "Você não está na mesa." quando `player.left` (ou decidir e registrar na spec que quem saiu pode consultar); teste | f335d98 - C84 |
