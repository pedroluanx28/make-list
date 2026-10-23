# Comandos Validation

## Validation: comandos - PASS ✅

**Date**: 2026-10-23
**Spec**: `.specs/features/comandos/spec.md`
**Diff range**: `3bd2d94..HEAD` (156bf2b feat, 4cb29cc docs) na branch `feat/comandos`
**Verifier**: sub-agente independente (autor ≠ verificador)
**Iteração**: 2 de 3 (re-verificação após a correção 1, que alterou só `.specs/features/comandos/spec.md`, sem commit)

---

## Task Completion

Não há `tasks.md` para a feature; a verificação usa a spec e o diff. Arquivos do diff: `src/commands/member/showCommands.ts`, `tests/commands/member/showCommands.test.ts`, `docs/showCommands.md`, `docs/README.md`, `README.md`, `.specs/features/comandos/spec.md`.

---

## Spec-Anchored Acceptance Criteria

Fixtures do teste: `tests/commands/member/showCommands.test.ts:16-28` (`HEADER`, `MEMBERS`, `ADMINS`, `OWNER`). Todas as asserções de mensagem usam `toBe` com a string inteira, então conferem conteúdo, formato, ordem e ausência de seções ao mesmo tempo.

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 `/comandos`, `/ajuda`, `/help` → uma única reply começando com `📋 *Comandos disponíveis*` | aliases `comandos`,`ajuda`,`help`; 1 chamada de `sendReply`; prefixo exato | `tests/commands/member/showCommands.test.ts:49` - `expect(showCommands.commands).toEqual(['comandos', 'ajuda', 'help'])`; `:37` - `expect(mockFunctions.sendReply).toHaveBeenCalledTimes(1)`; `:56` - `expect(message).toBe(\`${HEADER}\n\n${MEMBERS}\`)` com `HEADER = '📋 *Comandos disponíveis*'` (`:25`) | ✅ PASS (roteamento verificado sobre o `dist/` na seção Routing Check abaixo, conforme `.specs/features/comandos/spec.md:35`) |
| AC2 linha `• <primeira linha do usage> — <description>` | `• /ping — Verificar conexão com o bot` | `tests/commands/member/showCommands.test.ts:26` + `:56` - `expect(message).toBe(...)` | ✅ PASS |
| AC3 sem `description` → `• <usage>` | `• /desligar` | `tests/commands/member/showCommands.test.ts:22,28` + `:68` - `expect(message).toBe(\`${HEADER}\n\n${MEMBERS}\n\n${ADMINS}\n\n${OWNER}\`)` | ✅ PASS |
| AC4 seções `*Membros*`, `*Admins*`, `*Dono*` nessa ordem, vazias omitidas | ordem M→A→D | `tests/commands/member/showCommands.test.ts:68` e `:74` - `toBe(\`${HEADER}\n\n${MEMBERS}\n\n${ADMINS}\n\n${OWNER}\`)` | ✅ PASS |
| AC5 `*Membros*` sempre com todos os comandos de `member` | seção presente em todos os cenários | `tests/commands/member/showCommands.test.ts:56,62,68,74,81,90` - `toBe` começando com `${HEADER}\n\n${MEMBERS}` | ✅ PASS |
| AC6 admin/dono → inclui `*Admins*` | Membros + Admins | `tests/commands/member/showCommands.test.ts:62` - `toBe(\`${HEADER}\n\n${MEMBERS}\n\n${ADMINS}\`)` | ✅ PASS |
| AC7 não admin nem dono → omite admin | só Membros | `tests/commands/member/showCommands.test.ts:56` - `toBe(\`${HEADER}\n\n${MEMBERS}\`)` | ✅ PASS |
| AC8 dono → inclui `*Dono*` | Membros + Admins + Dono | `tests/commands/member/showCommands.test.ts:68` (owner do grupo) e `:74` (superadmin) | ✅ PASS |
| AC9 não dono → omite owner | admin sem `*Dono*` | `tests/commands/member/showCommands.test.ts:62` - `toBe(\`${HEADER}\n\n${MEMBERS}\n\n${ADMINS}\`)` | ✅ PASS |
| AC10 fora de grupo → só `member` | só Membros, mesmo sendo admin | `tests/commands/member/showCommands.test.ts:81` - `toBe(\`${HEADER}\n\n${MEMBERS}\`)`; `:82` - `expect(socket.groupMetadata).not.toHaveBeenCalled()` | ✅ PASS |
| AC11 mesma regra do `checkPermission` | reuso do middleware | `src/commands/member/showCommands.ts:29` chama `checkPermission` real (não mockado); `tests/commands/member/showCommands.test.ts:74` - superadmin tratado como dono, regra de `src/middlewares/checkPermission.ts:18` | ✅ PASS |

**Status**: ✅ Todos os ACs cobertos com o valor definido na spec.

---

## Edge Cases

- [x] `usage` multilinha → só a primeira linha: `tests/commands/member/showCommands.test.ts:19,26` (`/pedido <tempo>\nExemplo: ...` → `• /pedido <tempo> — Criar um pedido`), asserido em `:56`.
- [x] Primeira linha com ` — ` → corta antes: `tests/commands/member/showCommands.test.ts:21,27` (`/cardapio — lista os itens` → `• /cardapio — Editar o cardápio`), asserido em `:62`.
- [x] Pasta sem comandos → seção omitida: `tests/commands/member/showCommands.test.ts:86-90` (`admin: []`, `owner` ausente, chamador dono) - `toBe(\`${HEADER}\n\n${MEMBERS}\`)`.
- [x] Erro de metadados propaga: `tests/commands/member/showCommands.test.ts:97` - `rejects.toThrow('falhou')`; `:98` - `sendReply` não chamado.

---

## Success Criteria

| Criterion | Evidence | Result |
| --------- | -------- | ------ |
| `/comandos` responde em grupo e no privado, filtrado | ACs 6-10 acima | ✅ |
| Nenhum input curto existente muda de destino, exceto os registrados nas Assumptions | Routing Check abaixo; os 5 inputs que mudaram estão em `.specs/features/comandos/spec.md:34` | ✅ |

---

## Routing Check

Método definido em `.specs/features/comandos/spec.md:35`: comparar `findCommandImport` (`src/utils/index.ts:142-165`) antes/depois sobre o `dist/` compilado, porque o roteamento lê `dist/commands/*.js` e o Jest roda sobre `src/`.

- **Antes**: worktree descartável em `3bd2d94`, `node_modules` por symlink, `npm run build` exit 0. Worktree removido depois.
- **Depois**: repo real em `4cb29cc`, `npm run build` exit 0; `dist/commands/member/` sem `.js` órfão (10 arquivos, um por `.ts` de `src/commands/member/`).
- **Inputs**: os pedidos (`comandos`, `ajuda`, `help`, `a`, `c`, `h`, `u`, `da`, `os`), todas as entradas de 1 e 2 letras e todas as substrings dos três aliases novos.

| Input | Antes (`3bd2d94`) | Depois (`HEAD`) | Registrado na spec? |
| ----- | ----------------- | --------------- | ------------------- |
| `/comandos` | nenhum | `member:comandos` | alias novo |
| `/ajuda` | nenhum | `member:comandos` | alias novo |
| `/help` | nenhum | `member:comandos` | alias novo |
| `/a` | `member:markall` | `member:markall` | inalterado (`.specs/features/comandos/spec.md:33`) |
| `/c` | `admin:cardapio` | `member:comandos` | ✅ `.specs/features/comandos/spec.md:34` |
| `/h` | `member:racha` | `member:comandos` | ✅ `.specs/features/comandos/spec.md:34` |
| `/u` | `admin:cardapio` | `member:comandos` | ✅ `.specs/features/comandos/spec.md:34` |
| `/da` | `admin:cardapio` | `member:comandos` | ✅ `.specs/features/comandos/spec.md:34` |
| `/os` | `admin:cardapio` | `member:comandos` | ✅ `.specs/features/comandos/spec.md:34` |

Na varredura completa, os únicos inputs que tinham destino e mudaram são esses cinco, todos registrados. Outros 39 inputs que antes não casavam com nada agora vão para `comandos`; não havia destino anterior para perder.

Observação: a spec marca `/u`, `/da` e `/os` como `n` (não confirmados pelo usuário). Estão registrados, o que satisfaz o critério; a confirmação fica com o usuário.

---

## Discrimination Sensor

Executado num `git worktree` descartável em `HEAD` (4cb29cc) com `node_modules` por symlink; `npx jest tests/commands/member/showCommands.test.ts` por mutante. Baseline do `git status --porcelain` do repo real: vazio; após remover o worktree: vazio (idêntico).

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| M1 | `src/commands/member/showCommands.ts:29` | Inverte filtro de permissão (`!await checkPermission` → `await checkPermission`) | ✅ Killed (6 falhas) |
| M2 | `src/commands/member/showCommands.ts:6-7` | Troca ordem Membros/Admins | ✅ Killed (3) |
| M3 | `src/commands/member/showCommands.ts:13` | Não corta usage multilinha (junta linhas) | ✅ Killed (6) |
| M4 | `src/commands/member/showCommands.ts:13` | Não corta em ` — ` | ✅ Killed (3) |
| M5 | `src/commands/member/showCommands.ts:29` | Não omite seção vazia (remove `modules.length === 0 \|\|`) | ✅ Killed (1) |
| M6 | `src/commands/member/showCommands.ts:14` | Separador ` — ` → ` - ` | ✅ Killed (6) |
| M7 | `src/commands/member/showCommands.ts:29` | Engole erro de metadados (`.catch(() => false)`) | ✅ Killed (1) |
| M8 | `src/commands/member/showCommands.ts:29` | Checa permissão sempre como `member` | ✅ Killed (4) |
| M9 | `src/commands/member/showCommands.ts:14` | Omite linha de comando sem description | ✅ Killed (2) |
| M10 | `src/commands/member/showCommands.ts:34` | Separador entre seções `\n\n` → `\n` | ✅ Killed (6) |
| M11 | `src/commands/member/showCommands.ts:37` | Envia uma segunda mensagem | ✅ Killed (6) |
| M12 | `src/commands/member/showCommands.ts:24` | Cabeçalho alterado | ✅ Killed (6) |
| M13 | `src/commands/member/showCommands.ts:33` | Inverte ordem dentro da seção | ✅ Killed (6) |

**Sensor depth**: lightweight ampliado (13 mutações)
**Result**: 13/13 killed - sensor aprovado ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ 39 linhas, sem abstração extra |
| Surgical changes | ✅ só arquivos da feature + índices de doc |
| No scope creep | ✅ |
| Matches patterns | ✅ segue `_sample.ts`; reusa `readCommandImports` e `checkPermission` |
| Spec-anchored outcome check | ✅ asserções `toBe` com a string inteira |
| Per-layer Coverage Expectation | ✅ 100% stmts/branches/funcs/lines em `showCommands.ts` |
| Every test maps to a spec requirement | ✅ (teste de metadados `:46` → AC1) |
| Documented guidelines followed: `CLAUDE.md` (Definition of Done) | ✅ colisões de alias checadas e registradas na spec (`.specs/features/comandos/spec.md:34`) |

Docs: `docs/showCommands.md`, entrada em `docs/README.md:13-15` e `README.md:20` presentes.

---

## Gate Check

- **Gate command**: `npm run build && npm test` (sem `tasks.md`; comandos do `CLAUDE.md`)
- **Build**: `tsc` exit 0
- **Result**: 178 passed, 0 failed, 0 skipped (12 suites)
- **Test count before feature**: 170
- **Test count after feature**: 178
- **Delta**: +8 testes
- **Skipped tests**: nenhum
- **Failures**: nenhuma

---

## Fix Plans

### Fix 1: inputs curtos sequestrados pelos novos aliases - resolvido na iteração 2

- **Iteração 1**: `/c`, `/h`, `/u`, `/da`, `/os` mudavam de destino sem registro na spec.
- **Correção aplicada**: a spec registra os cinco inputs nas Assumptions (`.specs/features/comandos/spec.md:34`) e define a verificação de roteamento sobre o `dist/` (`.specs/features/comandos/spec.md:35`). O código não mudou.
- **Re-verificação**: Routing Check acima, todos os inputs alterados registrados.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| CMDS-01 | Implementing | ✅ Verified |
| CMDS-02 | Implementing | ✅ Verified |
| CMDS-03 | Implementing | ✅ Verified |
| CMDS-04 | Implementing | ✅ Verified |
| CMDS-05 | Implementing | ✅ Verified |
| CMDS-06 | Implementing | ✅ Verified |
| CMDS-07 | Implementing | ✅ Verified |
| Success Criterion 2 (inputs curtos) | ❌ Needs Fix (iteração 1) | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 11/11 ACs e 4/4 edge cases batem com a spec; os 2 Success Criteria atendidos
**Sensor**: 13/13 mutations killed (código inalterado desde a iteração 1)
**Gate**: build ok, 178 passed
**Routing**: 5 inputs mudaram de destino, 5/5 registrados na spec

**What works**: listagem, formato, ordem, filtro de permissão, fora de grupo, propagação de erro, roteamento dos aliases; testes discriminam bem.

**Issues found**: nenhum bloqueante. `/u`, `/da` e `/os` estão registrados mas sem confirmação do usuário (`n` na spec).

**Next steps**: commit da spec e deste relatório quando o orquestrador decidir.
