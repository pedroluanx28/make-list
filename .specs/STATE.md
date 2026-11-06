# STATE

## Decisions

### AD-001
- **Decision**: O bot aceita `/` e `.` como prefixo de todos os comandos.
- **Reason**: O poker usa `.poker`, e o user escolheu "Aceitar "/" e "." (Recommended)" para não quebrar quem já usa `/pedido` e os demais.
- **Trade-off**: Mensagens comuns que começam com `.` seguido de um alias (ex.: `.ping`) passam a acionar comandos.
- **Scope**: `src/config.ts`, `src/middlewares/index.ts` (`verifyPrefix`), `src/utils/index.ts` (`extractDataFromMessage`); todas as features.
- **Date**: 2026-10-28
- **Status**: active

### AD-002
- **Decision**: Com o prefixo `.`, só o alias exato aciona um comando, e uma mensagem que começa com `..` não tem comando. Com `/` a busca aproximada continua.
- **Reason**: A verificação do poker mostrou que `.a` mencionava o grupo todo (`/markAll`), `.ok` abria a ajuda do poker e `...e` caía no `/deletarlembrete`; o user aprovou "aceitar só um ponto seguido de letra e só o alias exato".
- **Trade-off**: Abreviações como `.p` deixam de funcionar; quem quiser abreviar usa `/`.
- **Scope**: `src/utils/index.ts` (`extractDataFromMessage`, `findCommandImport`), `src/utils/dynamicCommand.ts`; todas as features. Refina o AD-001.
- **Date**: 2026-11-04
- **Status**: active

## Handoff

- **Feature**: poker (`.specs/features/poker/`)
- **Phase / Task**: Execute concluído (T1-T6 commitadas); falta a verificação final da skill
- **Completed**: T1, T2, T3, T4, T5, T6
- **In-progress** (file:line): nenhum
- **Next step**: rodar `check_proofs.py` + Verifier independente (precisa de permissão para os scripts e para disparar o sub-agente), depois testar uma mesa real num grupo
- **Blockers**: scripts Python da skill bloqueados pelo auto mode; o bot caiu com rejeição não tratada da Baileys (ver handoff.md)
- **Uncommitted files**: nenhum
- **Branch**: feat/poker
