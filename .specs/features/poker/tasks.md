# Poker Tasks

**Design**: `.specs/features/poker/design.md`
**Status**: In Progress
**Approved**: não apresentado para revisão; o user mandou implementar direto - user: "certo, pode começar a codar!" (2026-10-28)
**Mutations**: 3
**Build**: `npm run build; npm test`

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

### T11: Saída da mesa no motor [ ]
**What**: `leaveTable` (antes do início remove; na mão dá fold; marca `left`), quem saiu fora das próximas mãos e marcado no resumo.
**Where**: `src/utils/pokerManager.ts` · **Depends on**: T10 · **Requirement**: POKER-18 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): permite sair da mesa no motor`

### T12: Socket ativo compartilhado [ ]
**What**: `setActiveSocket`/`getActiveSocket`, registrado pelo loader a cada socket.
**Where**: `src/utils/activeSocket.ts` · **Depends on**: None · **Requirement**: POKER-16 · **Tests**: unit · **Gate**: build
**Commit**: `feat(conexao): guarda o socket ativo para tarefas agendadas`

### T13: Relógio da vez [ ]
**What**: `startClock`/`stopClock` com aviso aos 10 s restantes e fim do tempo.
**Where**: `src/utils/pokerClock.ts` · **Depends on**: None · **Requirement**: POKER-16 · **Tests**: unit (fake timers) · **Gate**: build
**Commit**: `feat(poker): adiciona o relógio da vez`

### T14: Tempo limite no comando [ ]
**What**: linha do relógio na vez, liga/desliga o relógio, extensão ou fold por tempo, retomada após reinício.
**Where**: `src/commands/member/poker.ts`, `src/index.ts` · **Depends on**: T10, T12, T13 · **Requirement**: POKER-16, POKER-17 · **Tests**: unit (fake timers) · **Gate**: build
**Commit**: `feat(poker): aplica tempo limite e time bank na vez de cada jogador`

### T15: Subcomando `.poker sair` [ ]
**What**: `sair` com resultado do jogador, vez passada adiante e encerramento quando sobra menos de 2.
**Where**: `src/commands/member/poker.ts` · **Depends on**: T11, T14 · **Requirement**: POKER-18 · **Tests**: unit · **Gate**: build
**Commit**: `feat(poker): adiciona o subcomando sair`

### T16: Documentação [ ]
**What**: ajuda do comando e `docs/poker.md` com tempo limite, time bank e `sair`.
**Where**: `docs/poker.md` · **Depends on**: T15 · **Requirement**: DoD · **Tests**: none · **Gate**: build
**Commit**: `docs(poker): documenta tempo limite, time bank e sair`

```
T10 → T11 → T12 → T13 → T14 → T15 → T16
```

---

## Handoff

**Settled mid-build:** user: "certo, pode começar a codar!" - implementar sem revisar as tasks.
**Dispatched:** none
**Walked:** none
