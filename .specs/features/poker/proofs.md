# poker proofs

**HEAD**: 59b22dd
**Tree**: clean
**Shell**: /bin/sh
**Result**: 80 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run command / ✓ should open a table with the default 0.10 minimum` | pass |
| C2 | `run command / ✓ should open a table with the minimum given` | pass |
| C3 | `run command / ✓ should refuse a second table in the same group` | pass |
| C4 | `run command / ✓ should refuse an invalid minimum` | pass |
| C5 | `run engine / ✓ should reject "1.234"` | pass |
| C6 | `run command / ✓ should seat the player and list everyone in seat order` | pass |
| C7 | `run engine / ✓ should refuse the same person twice` | pass |
| C8 | `run engine / ✓ should refuse a name already used, ignoring case` | pass |
| C9 | `run engine / ✓ should refuse an 11th player` | pass |
| C10 | `run engine / ✓ should refuse a player once the table has started` | pass |
| C11 | `run engine / ✓ should reject "abc"` | pass |
| C12 | `run command / ✓ should announce the deal, send each player their cards in private and then who starts` | pass |
| C13 | `run engine / ✓ should draw the requested number of cards from a new shuffled deck in one request` | pass |
| C14 | `run command / ✓ should send only the text when a card image fails` | pass |
| C15 | `run engine / ✓ should make the first player the button, the second the small blind and the third the big blind` | pass |
| C16 | `run engine / ✓ should make the button the small blind and first to act preflop in heads-up` | pass |
| C17 | `run command / ✓ should refuse to start with fewer than two players` | pass |
| C18 | `run command / ✓ should refuse to start while a hand is in progress` | pass |
| C19 | `run command / ✓ should not start the hand when the deck API fails` | pass |
| C20 | `run command / ✓ should announce the action and tag the next player with their options` | pass |
| C21 | `run command / ✓ should refuse an action out of turn` | pass |
| C22 | `run engine / ✓ should refuse an action from someone not playing the hand` | pass |
| C23 | `run engine / ✓ should refuse a check when there is a bet to pay` | pass |
| C24 | `run engine / ✓ should refuse a raise below the minimum raise` | pass |
| C25 | `run engine / ✓ should refuse a raise above the player chips` | pass |
| C26 | `run engine / ✓ should turn a call the player cannot cover into an all-in` | pass |
| C27 | `run engine / ✓ should open the flop with three board cards and the first active player left of the button` | pass |
| C28 | `run engine / ✓ should reveal the turn and the river one card at a time` | pass |
| C29 | `run engine / ✓ should give the pot to the last player when everyone else folds` | pass |
| C30 | `run engine / ✓ should reveal the remaining board without betting when everyone is all-in` | pass |
| C31 | `run engine / ✓ should name the hand of each player still in at the showdown` | pass |
| C32 | `run engine / ✓ should rank a higher category above a lower one` | pass |
| C33 | `run engine / ✓ should split side pots so a short all-in only wins the main pot` | pass |
| C34 | `run engine / ✓ should split a tied pot and give the odd cent to the first winner left of the button` | pass |
| C35 | `run command / ✓ should give the pot on folds, show the chips and deal the next hand` | pass |
| C36 | `run engine / ✓ should move the button clockwise and skip players without chips on the next hand` | pass |
| C37 | `run command / ✓ should show the showdown and end the table when one player has all the chips` | pass |
| C38 | `run acabar / ✓ should void the hand in progress, send the summary and delete the table` | pass |
| C39 | `run engine / ✓ should give back every bet of a hand in progress` | pass |
| C40 | `run engine / ✓ should report buy-in, final chips and balance of each player` | pass |
| C41 | `run acabar / ✓ should let a group admin end a table before it starts` | pass |
| C42 | `run acabar / ✓ should refuse when there is no table` | pass |
| C43 | `run acabar / ✓ should refuse someone who is neither at the table nor an admin` | pass |
| C44 | `run command / ✓ should show the showdown and end the table when one player has all the chips` | pass |
| C45 | `run engine / ✓ should refuse a buy-in above 200 times the table minimum` | pass |
| C46 | `run engine / ✓ should accept a buy-in of exactly 200 times the table minimum` | pass |
| C47 | `run engine / ✓ should refuse a buy-in below 10 times the table minimum` | pass |
| C48 | `run engine / ✓ should accept a buy-in of exactly 10 times the table minimum` | pass |
| C49 | `run saldo / ✓ should reply with the chips, buy-in and balance of who asked` | pass |
| C50 | `run saldo / ✓ should show what is in the pot and count it in the balance during a hand` | pass |
| C51 | `run saldo / ✓ should refuse someone who is not at the table` | pass |
| C52 | `run command / ✓ should announce the action and tag the next player with their options` | pass |
| C53 | `run command / ✓ should tag the player when 10 seconds are left` | pass |
| C54 | `run command / ✓ should warn again 10 seconds before an extension ends` | pass |
| C55 | `run command / ✓ should spend a time bank extension when the time runs out and keep the turn` | pass |
| C56 | `run command / ✓ should fold the player when the time runs out with no extensions left and pass the turn` | pass |
| C57 | `run command / ✓ should fold even when a check was possible` | pass |
| C58 | `run command / ✓ should start the clock over for the next player when someone acts in time` | pass |
| C59 | `run engine / ✓ should not refill the extensions on the next hand` | pass |
| C60 | `run command / ✓ should give the player to act a full turn again after a restart` | pass |
| C61 | `run sair / ✓ should free the seat before the table starts and list who is still seated` | pass |
| C62 | `run sair / ✓ should leave the bets in the pot and keep the clock of the player to act when someone else leaves` | pass |
| C63 | `run sair / ✓ should fold the player to act, show the result and pass the turn with a new clock` | pass |
| C64 | `run engine / ✓ should not deal cards, give the button or count chips of who left` | pass |
| C65 | `run engine / ✓ should list who left in the summary with their result` | pass |
| C66 | `run sair / ✓ should end the table with everyone in the summary when only one player is left` | pass |
| C67 | `run sair / ✓ should refuse someone who is not at the table` | pass |
| C68 | `run command / ✓ should reply with the help text for "ajuda"` | pass |
| C69 | `run command / ✓ should show the help when the message has no arguments at all` | pass |
| C70 | `run prefix / ✓ should run the command when the prefix is "."` | pass |
| C71 | `run prefix / ✓ should ignore the message when the prefix is "!" (a different prefix)` | pass |
| C72 | `run command / ✓ should point to the help for an unknown subcommand` | pass |
| C73 | `run engine / ✓ should save and load a table by group` | pass |
| C74 | `run engine / ✓ should treat corrupted JSON as no table` | pass |
| C75 | `run engine / ✓ should return null when there is no poker file` | pass |
| C76 | `run engine / ✓ should put a short big blind all-in with what is left` | pass |
| C77 | `run engine / ✓ should read 0,5 as 50 cents` | pass |
| C78 | `run command / ✓ should refuse any other subcommand in a private chat` | pass |
| Build | `npm run build` | pass |
| Build | `npm test` | pass |

## Output

`Run command` - exit 0

```
      ✓ should refuse when there is no table (1 ms)
      ✓ should refuse someone who is not at the table (1 ms)
      ✓ should reply with the chips, buy-in and balance of who asked (1 ms)
      ✓ should show what is in the pot and count it in the balance during a hand (1 ms)
    acabar
      ✓ should refuse when there is no table (2 ms)
      ✓ should refuse someone who is neither at the table nor an admin (1 ms)
      ✓ should void the hand in progress, send the summary and delete the table (2 ms)
      ✓ should let a group admin end a table before it starts (1 ms)

Test Suites: 1 passed, 1 total
Tests:       71 passed, 71 total
Snapshots:   0 total
Time:        2.008 s, estimated 9 s
Ran all test suites matching tests/commands/member/poker.test.ts.
```

`Run engine` - exit 0

```
      ✓ should keep the turn with the player to act when someone else leaves (1 ms)
      ✓ should give the pot to the last active player when the one leaving was the other
      ✓ should leave without folding when the player is not in the hand (1 ms)
      ✓ should not deal cards, give the button or count chips of who left
      ✓ should list who left in the summary with their result (1 ms)
      ✓ should refuse a second exit of the same player
    withTableLock
      ✓ should run tasks of the same group one at a time (1 ms)
      ✓ should keep running tasks after one fails (1 ms)

Test Suites: 4 passed, 4 total
Tests:       119 passed, 119 total
Snapshots:   0 total
Time:        4.092 s, estimated 9 s
Ran all test suites matching tests/utils/pokerManager.test.ts|tests/utils/pokerHand.test.ts|tests/utils/pokerClock.test.ts|tests/utils/deckOfCards.test.ts.
```

`Run acabar` - exit 0

```
      ○ skipped should refuse when there is no table
      ○ skipped should refuse someone who is not at the table
      ○ skipped should reply with the chips, buy-in and balance of who asked
      ○ skipped should show what is in the pot and count it in the balance during a hand
    acabar
      ✓ should refuse when there is no table (15 ms)
      ✓ should refuse someone who is neither at the table nor an admin (2 ms)
      ✓ should void the hand in progress, send the summary and delete the table (4 ms)
      ✓ should let a group admin end a table before it starts (2 ms)

Test Suites: 1 passed, 1 total
Tests:       67 skipped, 4 passed, 71 total
Snapshots:   0 total
Time:        1.759 s, estimated 2 s
Ran all test suites matching tests/commands/member/poker.test.ts with tests matching "poker command acabar".
```

`Run saldo` - exit 0

```
      ✓ should refuse when there is no table (16 ms)
      ✓ should refuse someone who is not at the table (2 ms)
      ✓ should reply with the chips, buy-in and balance of who asked (1 ms)
      ✓ should show what is in the pot and count it in the balance during a hand (4 ms)
    acabar
      ○ skipped should refuse when there is no table
      ○ skipped should refuse someone who is neither at the table nor an admin
      ○ skipped should void the hand in progress, send the summary and delete the table
      ○ skipped should let a group admin end a table before it starts

Test Suites: 1 passed, 1 total
Tests:       67 skipped, 4 passed, 71 total
Snapshots:   0 total
Time:        1.69 s, estimated 2 s
Ran all test suites matching tests/commands/member/poker.test.ts with tests matching "poker command saldo".
```

`Run sair` - exit 0

```
      ○ skipped should refuse when there is no table
      ○ skipped should refuse someone who is not at the table
      ○ skipped should reply with the chips, buy-in and balance of who asked
      ○ skipped should show what is in the pot and count it in the balance during a hand
    acabar
      ○ skipped should refuse when there is no table
      ○ skipped should refuse someone who is neither at the table nor an admin
      ○ skipped should void the hand in progress, send the summary and delete the table
      ○ skipped should let a group admin end a table before it starts

Test Suites: 1 passed, 1 total
Tests:       59 skipped, 12 passed, 71 total
Snapshots:   0 total
Time:        1.699 s, estimated 2 s
Ran all test suites matching tests/commands/member/poker.test.ts with tests matching "poker command sair".
```

`Run prefix` - exit 0

```
      ✓ should propagate a failure of the reply helper itself (1 ms)

PASS tests/utils/extractDataFromMessage.test.ts
  extractDataFromMessage
    ✓ should read the command name and prefix when the message starts with "/" (5 ms)
    ✓ should read the command name and prefix when the message starts with "."
    ✓ should strip repeated prefixes before the command name (1 ms)
    ✓ should keep the first character as prefix when the message has no known prefix (1 ms)
    ✓ should leave an empty command name for a message made only of dots

Test Suites: 2 passed, 2 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        2.212 s, estimated 9 s
Ran all test suites matching tests/utils/dynamicCommand.test.ts|tests/utils/extractDataFromMessage.test.ts.
```
