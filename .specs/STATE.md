# STATE

## Decisions

### AD-001
- **Decision**: O bot aceita `/` e `.` como prefixo de todos os comandos.
- **Reason**: O poker usa `.poker`, e o user escolheu "Aceitar "/" e "." (Recommended)" para não quebrar quem já usa `/pedido` e os demais.
- **Trade-off**: Mensagens comuns que começam com `.` seguido de um alias (ex.: `.ping`) passam a acionar comandos.
- **Scope**: `src/config.ts`, `src/middlewares/index.ts` (`verifyPrefix`), `src/utils/index.ts` (`extractDataFromMessage`); todas as features.
- **Date**: 2026-10-28
- **Status**: active

## Handoff

- **Feature**: poker (`.specs/features/poker/`)
- **Phase / Task**: Specify concluído em conteúdo; falta adaptar o spec ao formato completo da skill, depois Design e Tasks
- **Completed**: spec.md (aprovado pelo user), context.md
- **In-progress** (file:line): nenhum código escrito
- **Next step**: ler `.specs/features/poker/handoff.md` inteiro e seguir a seção "Próximos passos"
- **Blockers**: scripts Python da skill precisam de permissão do user para rodar (auto mode bloqueou)
- **Uncommitted files**: `.specs/STATE.md`, `.specs/features/poker/spec.md`, `.specs/features/poker/context.md`, `.specs/features/poker/handoff.md`
- **Branch**: feat/poker
