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

---

## Handoff

**Settled mid-build:** user: "certo, pode começar a codar!" - implementar sem revisar as tasks.
**Dispatched:** none
**Walked:** none
