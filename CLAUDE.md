# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

WhatsApp group bot written in TypeScript on top of `@whiskeysockets/baileys`. User-facing strings, comments and docs are in Portuguese (pt-BR).

## Commands

```bash
npm run build          # tsc → dist/
npm run dev            # build, then run dist/index.js
npm run dev:force      # wipe dist/, rebuild, run (use when stale .js files linger in dist/)
npm test               # jest (ts-jest)
npm run test:coverage
npx jest tests/commands/member/ping.test.ts      # single file
npx jest -t "should send react"                  # single test by name
DEBUG=1 npm test       # tests/setup.ts silences console.log unless DEBUG is set
```

There is no linter configured.

On first run the bot asks for a phone number in the terminal and prints a pairing code; credentials are persisted in `assets/auth/baileys/` (gitignored). Baileys logs go to `assets/temp/wa-logs.txt`, not stdout.

## Architecture

**Message flow:** `index.ts` → `connection.ts` (creates the Baileys socket, auto-reconnects unless logged out) → `loader.ts` (subscribes to `messages.upsert`, delays each event by `TIMEOUT_BY_EVENT` to avoid WhatsApp bans, starts persisted reminders) → `middlewares/onMessagesUpsert.ts` → `utils/loadCommonFunctions.ts` → `utils/dynamicCommand.ts`.

**Command discovery is runtime, filesystem-based, and reads compiled JS.** `readCommandImports()` in `utils/index.ts` scans each subdirectory of `COMMANDS_DIR` (`dist/commands/`) and `require`s every `.js` file not starting with `_`. Consequences:
- Changes to commands only take effect after `tsc`; deleted `.ts` files can leave stale `.js` in `dist/` that still load (use `dev:force`).
- The **subdirectory name is the permission level**: `member`, `admin`, or `owner` (checked in `middlewares/checkPermission.ts` against group metadata). `checkPermission` denies admin/owner commands outside groups.
- Each command file exports a named object of type `Command` (`name`, `description`, `commands` aliases, `usage`, `handle`). The export name is irrelevant; the first export of the module is used. Template: `src/commands/_sample.ts`.
- Alias matching (`findCommandImport` in `utils/index.ts`) normalizes with `formatCommand` (lowercased, accents stripped, alphanumerics only) and runs three passes over all commands: exact alias, then alias `startsWith` input, then alias `includes` input. Within each pass, `member` commands are tried before `admin` before `owner`, and within a folder files are tried in alphabetical order (first match wins), so a fuzzy input never lands on an admin command when a member one matches. Short inputs still fuzzy-match (e.g. `/p` → `pedido`, `/encerrar` → `pedido-encerrar`), so new aliases can hijack inputs that previously matched nothing or another command.

**Command handlers** receive a `CommonFunctions` object (built in `loadCommonFunctions.ts`): parsed message data (`args` are split on `\`, `|`, `/`; `fullArgs` is the raw remainder) plus helpers like `sendReply`, `sendText`, `send{Success,Error,Warning}Reply`, `getGroupParticipants`. Text helpers prefix `BOT_EMOJI` automatically.

**Errors:** throw `InvalidParameterError`, `WarningError` or `DangerError` (from `src/errors`) inside a handler; `dynamicCommand` maps them to warning/error replies. Any other error is reported with its message.

**Global ambient types:** `Command`, `CommonFunctions` and `Participant` in `src/@types/` are declared as global types (no `export`) and used without imports, in both `src` and `tests`.

**Stateful features:**
- Reminders (`utils/reminderManager.ts`) persist to `assets/reminders.json` and are rescheduled with `setTimeout` on startup.
- The `/pedido` menu (`utils/menuManager.ts`) is global and persists to `assets/menu.json` (falls back to `DEFAULT_MENU_ITEMS`). It is edited with the admin-only `/cardapio` command, which blocks changes while any order is open. Each order keeps a snapshot of the menu in `ActiveOrder.menuItems`.
- `/pedido` orders (`utils/pedidoManager.ts`) are in-memory only (lost on restart). They use WhatsApp polls: the poll key is `messageContextInfo.messageSecret` from the message `sendMessage` returns, and votes are encrypted with the bot's JID (PN or LID) as poll creator. `onMessagesUpsert` routes `pollUpdateMessage` votes to `recordVote`, which decrypts them manually with `decryptPollVote` (this Baileys version doesn't emit decrypted `pollUpdates`).

**Baileys patch:** `patches/@whiskeysockets+baileys+6.7.18.patch` fixes a `long` type import in Baileys' `.d.ts`. There is no `postinstall` script, so apply it manually with `npx patch-package` after `npm install` if `tsc` fails on that type.

## Tests

Tests live in `tests/` mirroring `src/` (commands, middlewares, utils), are written in TypeScript, and build handler params with `createMockCommonFunctions(overrides)` from `tests/mocks/commonFunctions.ts`. Code that persists to `assets/*.json` is tested with an in-memory `jest.mock('fs', ...)` backed by a `Map` (see `tests/commands/admin/cardapio.test.ts`), and timers with `jest.useFakeTimers({ now })` + `advanceTimersByTimeAsync` — tests must never touch the real `assets/` directory. The installed Baileys (6.7.21) is ESM-only and Jest runs CommonJS, so any test that imports code depending on `@whiskeysockets/baileys` must `jest.mock` it (see `tests/commands/member/pedido.test.ts`); Node 22 loads it fine at runtime. Only `*.test.ts` is matched; any `.js`/`.js.map` files under `tests/` are stray compiler output and should not be edited. The README states a 100% coverage target for commands, and new commands are expected to ship with tests and a doc page in `docs/`.

## Conventions

- **Language:** code identifiers in English; user-facing strings, comments, docs, commit messages and PRs in pt-BR.
- **Branches:** `tipo/descricao-curta` off `main` (`feat/`, `fix/`, `refactor/`, `docs/`, `chore/`). Never commit directly to `main`.
- **Commits:** Conventional Commits in pt-BR with a scope, e.g. `feat(pedido): permite encerrar pelo admin`. No `wip` commits on shared branches.
- **Never commit** anything under `assets/` (auth credentials, `wa-logs.txt` with phone numbers/JIDs, persisted JSON) or compiled `.js` under `tests/`. The git history was already rewritten once to purge leaked logs.
- **Errors:** prefer throwing `InvalidParameterError`/`WarningError`/`DangerError` over hand-written `❌` replies in new commands.

## Definition of Done (new or changed command)

1. Command file in `src/commands/<member|admin|owner>/`, based on `_sample.ts`; check aliases don't collide with existing ones under the three-pass matching rule above.
2. Tests in the mirrored `tests/` path, 100% coverage for the command file (`npx jest --coverage <test file>`).
3. Doc page `docs/<commandName>.md` following `docs/_template.md`.
4. Entry in `docs/README.md` and in the commands table of the root `README.md`.
5. `npm run build` and `npm test` pass.

## Claude Code setup (`.claude/`)

- `/new-command` skill scaffolds a command following the Definition of Done.
- `command-reviewer` agent reviews command changes against the checklist above; `test-writer` agent writes tests in the repo's style.
- A PostToolUse hook runs `tsc --noEmit` after edits to `src/` and reports type errors back.
- Use the `/ship` skill to commit and open PRs.
