# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - When adding command aliases, enumerate every short input whose findCommandImport destination changes and either register it in the spec or pin it with a routing test
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `command-aliases` · harmful: 0
- features: comandos
- evidence: validation.md Success Criteria 2; src/utils/index.ts:142 (command-aliases)
- last seen: 2026-10-23T23:19:19Z

### L-002 - In any chip-moving engine, add a test asserting the table chip total is unchanged after each hand path (fold win, showdown, side pots, a player leaving)
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `poker-engine` · harmful: 0
- features: poker
- evidence: POKER-19 / verification.md achado 1 (poker-engine)
- last seen: 2026-11-04T21:58:20Z

### L-003 - Every action that can change who still has to act (fold, leave, timeout) must run the same advance-the-hand step as a normal action, with a test per entry point
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `poker-engine` · harmful: 0
- features: poker
- evidence: POKER-06 AC 7 / verification.md achado 2 (poker-engine)
- last seen: 2026-11-04T21:58:20Z

### L-004 - A test for a counter or a timer must use a value other than the initial one and check both sides of the boundary, not only the default case
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: poker
- evidence: C52, C60 / verification.md (tests)
- last seen: 2026-11-04T21:58:20Z

### L-005 - When a default value is derived (e.g. double the bet), state in the spec what happens when it falls below a separate minimum rule
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `poker-engine` · harmful: 0
- features: poker
- evidence: POKER-20 / verification.md achado 4 (poker-engine)
- last seen: 2026-11-04T21:58:20Z

### L-006 - A new command prefix must be checked against ordinary chat text (punctuation, ellipsis) together with fuzzy alias matching, with routing tests for those inputs
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `command-aliases` · harmful: 0
- features: poker
- evidence: AD-002 / verification.md achado 8 (command-aliases)
- last seen: 2026-11-04T21:58:20Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
