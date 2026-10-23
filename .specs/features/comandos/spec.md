# Comando de listagem de comandos — Especificação

## Problem Statement

Quem está no grupo não tem como descobrir pelo WhatsApp quais comandos o bot aceita; a lista só existe no `README.md`. Um comando que liste os comandos disponíveis, já filtrados pelo que a pessoa pode executar, resolve isso sem sair da conversa.

## Goals

- [ ] Um membro descobre todos os comandos que pode usar enviando um único comando.
- [ ] A lista é gerada a partir dos comandos carregados em tempo de execução, sem lista manual para manter.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Ajuda detalhada de um comando (`/comandos pedido`) | Não pedido; a doc de cada comando já fica em `docs/` |
| Listar aliases de cada comando | Formato escolhido: só uso + descrição |
| Paginação ou divisão em várias mensagens | São ~11 comandos; cabe numa mensagem |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Visibilidade | Só os comandos que quem chamou pode executar | Decisão do usuário | y |
| Formato | Uma linha por comando: primeira linha do `usage` + `—` + `description` | Decisão do usuário | y |
| Agrupamento | Seções por permissão, na ordem Membros, Admins, Dono; seção sem comandos não aparece | Deixa claro por que um comando aparece; mesma ordem de prioridade do `findCommandImport` | n |
| `usage` com várias linhas (ex.: `/pedido`) | Usar só a primeira linha | Mantém uma linha por comando; o exemplo fica na doc | y |
| `usage` cuja primeira linha traz nota após ` — ` (ex.: `/cardapio — lista os itens`) | Cortar a partir do primeiro ` — ` | Sem isso a linha fica com dois `—` (achado no teste com os comandos reais) | n |
| Comando sem `description` | Mostrar só o uso | `description` é opcional no tipo `Command` | n |
| Aliases | `comandos`, `ajuda`, `help` | Nomes óbvios em pt-BR e inglês | n |
| Nome do arquivo | `src/commands/member/showCommands.ts` | Dentro de `member/` os arquivos são testados em ordem alfabética; um nome depois de `markAll.ts` evita que `ajuda` roube o input `/a` (hoje → `markall`) | n |
| Fora de grupo | Mostra só os de membro | `checkPermission` nega admin/owner fora de grupo; reaproveitamos a mesma regra | n |
| Falha ao ler metadados do grupo | Erro propaga para o `dynamicCommand`, que responde com a mensagem genérica | Mesmo comportamento dos comandos de admin hoje | n |
| Ordem dos comandos dentro da seção | Ordem de carregamento (alfabética por arquivo) | Determinística e sem regra extra | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Listar os comandos que posso usar ⭐ MVP

**User Story**: Como participante do grupo, quero enviar `/comandos` e receber a lista dos comandos que posso executar, para usar o bot sem consultar o README.

**Why P1**: É a feature inteira.

**Acceptance Criteria**:

1. WHEN alguém envia `/comandos`, `/ajuda` ou `/help` THEN o bot SHALL responder (reply) com uma única mensagem que começa com `📋 *Comandos disponíveis*`.
2. The bot SHALL listar cada comando numa linha no formato `• <primeira linha do usage> — <description>`.
3. WHERE o comando não tem `description` the bot SHALL listar a linha como `• <primeira linha do usage>`.
4. The bot SHALL agrupar os comandos em seções `*Membros*`, `*Admins*` e `*Dono*`, nessa ordem, omitindo seções sem comandos visíveis.
5. The bot SHALL sempre incluir a seção `*Membros*` com todos os comandos de `member`.
6. WHEN quem chama é admin ou dono do grupo THEN o bot SHALL incluir a seção `*Admins*` com os comandos de `admin`.
7. IF quem chama não é admin nem dono THEN o bot SHALL omitir os comandos de `admin`.
8. WHEN quem chama é dono do grupo THEN o bot SHALL incluir a seção `*Dono*` com os comandos de `owner`.
9. IF quem chama não é dono THEN o bot SHALL omitir os comandos de `owner`.
10. IF o comando é enviado fora de um grupo THEN o bot SHALL listar somente os comandos de `member`.
11. The bot SHALL decidir a permissão de cada seção com a mesma regra do `checkPermission`.

**Independent Test**: num grupo, um membro comum envia `/comandos` e vê só a seção Membros; um admin envia e vê Membros e Admins.

---

## Edge Cases

- WHEN o `usage` tem várias linhas THEN o bot SHALL usar só a primeira.
- WHEN a primeira linha do `usage` contém ` — ` THEN o bot SHALL usar só o trecho antes do primeiro ` — `.
- IF uma pasta de permissão não tem comandos THEN o bot SHALL omitir a seção correspondente.
- IF a leitura dos metadados do grupo falhar THEN o bot SHALL deixar o erro propagar para o `dynamicCommand`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CMDS-01 | P1: AC 1 (aliases + cabeçalho) | Execute | Implementing |
| CMDS-02 | P1: AC 2-3 (formato da linha) | Execute | Implementing |
| CMDS-03 | P1: AC 4-5 (seções e ordem) | Execute | Implementing |
| CMDS-04 | P1: AC 6-7 (admins) | Execute | Implementing |
| CMDS-05 | P1: AC 8-9 (dono) | Execute | Implementing |
| CMDS-06 | P1: AC 10-11 (fora de grupo / mesma regra) | Execute | Implementing |
| CMDS-07 | Edge cases (usage multilinha, seção vazia, erro) | Execute | Implementing |

**Coverage:** 7 total, 7 mapped, 0 unmapped

---

## Success Criteria

- [ ] `/comandos` responde em grupo e no privado, com a lista filtrada pela permissão.
- [ ] Nenhum input curto existente muda de destino, exceto os registrados nas Assumptions.
