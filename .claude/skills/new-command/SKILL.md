---
name: new-command
description: Cria um novo comando do bot (arquivo, testes, doc e entradas nos índices) seguindo a Definition of Done do CLAUDE.md. Use quando o usuário pedir um comando novo para o bot do WhatsApp.
argument-hint: <nome> <member|admin|owner> <o que o comando faz>
---

# /new-command — Novo comando do bot

Cria um comando completo, pronto para PR. Argumentos: `$ARGUMENTS`

## 1. Entender antes de escrever

- Se faltar o nome, a permissão (`member`, `admin`, `owner`) ou o comportamento, pergunte antes de criar arquivos.
- Leia `src/commands/_sample.ts`, um comando parecido já existente na mesma pasta de permissão e o teste dele.
- **Colisão de aliases:** o `findCommandImport` (`src/utils/index.ts`) normaliza com `formatCommand` e faz três passadas: alias exato, depois alias que começa com o input, depois alias que contém o input; em cada passada, `member` vem antes de `admin` e de `owner`, e dentro da pasta os arquivos são testados em ordem alfabética (o primeiro que casar vence). Liste os aliases existentes com
  `grep -rn -A2 "commands:" src/commands --exclude=_sample.ts` e confirme que:
  - nenhum alias novo é idêntico (após normalizar) a um existente;
  - o comando novo não "rouba" inputs curtos que hoje vão para outro comando (ex.: um alias novo começando com `p` pode competir com `ping`/`pedido` no input `/p`);
  - aliases de uma letra ou genéricos (`d`, `encerrar`) são evitados.
  Para conferir de verdade, rode `npm run build` e teste os inputs com
  `node -e 'const {findCommandImport}=require("./dist/utils");for(const i of process.argv.slice(1))console.log(i,"→",findCommandImport(i).command?.name??"nenhum")' p pe d enc`.
  Rode o mesmo comando antes e depois de criar o arquivo e compare. Se houver conflito, proponha outro alias ao usuário.
- Se você estiver rodando como subagente e não puder perguntar, escolha a opção mais conservadora (menos aliases, nenhum alias genérico) e liste as decisões no relatório final.

## 2. Comando — `src/commands/<permissao>/<nomeCamelCase>.ts`

- Exporte um único objeto anotado como `export const nome: Command = { ... }` (tipo global, sem import) com `name`, `description`, `commands`, `usage` (usando `PREFIX` de `src/config`) e `handle`.
- Use os helpers de `CommonFunctions` (`sendReply`, `sendSuccessReply`, `getGroupParticipants`...). Eles já prefixam `BOT_EMOJI`.
- Para entrada inválida, lance `InvalidParameterError`; para avisos, `WarningError`; para falhas, `DangerError` (de `src/errors`).
- Textos para o usuário em pt-BR.
- Estado persistente vai num manager em `src/utils/` gravando em `assets/<nome>.json`, como `reminderManager.ts`/`menuManager.ts`.

## 3. Testes — `tests/commands/<permissao>/<nomeCamelCase>.test.ts`

- Monte os parâmetros com `createMockCommonFunctions({ ... })` de `tests/mocks/commonFunctions.ts`.
- Cubra: metadata (`name`, `commands`, `usage`), caminho feliz, cada validação/erro e cada branch.
- Se o código importar algo que dependa de `@whiskeysockets/baileys`, faça `jest.mock` dele (ver `tests/commands/member/pedido.test.ts`).
- Se gravar em `assets/`, mocke `fs` com um `Map` em memória (ver `tests/commands/admin/cardapio.test.ts`). Timers: `jest.useFakeTimers({ now })`. Aleatoriedade: `jest.spyOn(Math, 'random').mockReturnValue(...)`.
- Confirme 100% de cobertura do arquivo:
  `npx jest --coverage --collectCoverageFrom='src/commands/<permissao>/<nomeCamelCase>.ts' tests/commands/<permissao>/<nomeCamelCase>.test.ts`

## 4. Documentação

- Copie `docs/_template.md` para `docs/<nomeCamelCase>.md` e preencha todas as seções.
- Adicione a entrada no índice `docs/README.md` (mesmo formato das existentes).
- Adicione a linha na tabela "Comandos Disponíveis" do `README.md` da raiz, com a coluna de permissão.

## 5. Verificação final

Rode `npm run build` e `npm test`. Só considere pronto se ambos passarem. Depois, ofereça rodar o agente `command-reviewer` e o `/ship`.
