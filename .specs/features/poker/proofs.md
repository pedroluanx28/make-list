# poker proofs

**HEAD**: 0586b9a
**Tree**: clean
**Shell**: /bin/sh
**Result**: 88 pass, 0 fail

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
| C52 | `run command / ✓ should show the extensions left when the player gets the turn again` | pass |
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
| C79 | `run engine / ✓ should give back to who left the part of the bet nobody still in the hand could cover` | pass |
| C80 | `run engine / ✓ should reveal the rest of the board when the exit leaves only one player able to bet` | pass |
| C81 | `run sair / ✓ should play the hand out and deal the next one when the exit leaves only one player able to bet` | pass |
| C82 | `run engine / ✓ should reveal the remaining board without a new turn when the only player left to bet calls an ` | pass |
| C83 | `run engine / ✓ should let who has not acted yet raise after a short all-in` | pass |
| C84 | `run saldo / ✓ should refuse someone who already left the table` | pass |
| C85 | `run engine / ✓ should raise to the minimum when raise has no value` | pass |
| C86 | `run engine / ✓ should announce the minimum as the default` | pass |
| Build | `npm run build` | pass |
| Build | `npm test` | pass |

## Output

`Run command` - exit 0

```
      ✓ should refuse someone who is not at the table (1 ms)
      ✓ should refuse someone who already left the table (2 ms)
      ✓ should reply with the chips, buy-in and balance of who asked (1 ms)
      ✓ should show what is in the pot and count it in the balance during a hand (1 ms)
    acabar
      ✓ should refuse when there is no table (1 ms)
      ✓ should refuse someone who is neither at the table nor an admin (1 ms)
      ✓ should void the hand in progress, send the summary and delete the table (1 ms)
      ✓ should let a group admin end a table before it starts

Test Suites: 1 passed, 1 total
Tests:       74 passed, 74 total
Snapshots:   0 total
Time:        2.462 s
Ran all test suites matching tests/commands/member/poker.test.ts.
```

`Run engine` - exit 0

```
      ✓ should give the pot to the last active player when the one leaving was the other
      ✓ should leave without folding when the player is not in the hand
      ✓ should not deal cards, give the button or count chips of who left
      ✓ should give back to who left the part of the bet nobody still in the hand could cover (6 ms)
      ✓ should list who left in the summary with their result (1 ms)
      ✓ should refuse a second exit of the same player (1 ms)
    withTableLock
      ✓ should run tasks of the same group one at a time
      ✓ should keep running tasks after one fails (1 ms)

Test Suites: 4 passed, 4 total
Tests:       125 passed, 125 total
Snapshots:   0 total
Time:        3.974 s, estimated 12 s
Ran all test suites matching tests/utils/pokerManager.test.ts|tests/utils/pokerHand.test.ts|tests/utils/pokerClock.test.ts|tests/utils/deckOfCards.test.ts.
```

`Run acabar` - exit 0

```
      ○ skipped should refuse someone who is not at the table
      ○ skipped should refuse someone who already left the table
      ○ skipped should reply with the chips, buy-in and balance of who asked
      ○ skipped should show what is in the pot and count it in the balance during a hand
    acabar
      ✓ should refuse when there is no table (19 ms)
      ✓ should refuse someone who is neither at the table nor an admin (4 ms)
      ✓ should void the hand in progress, send the summary and delete the table (8 ms)
      ✓ should let a group admin end a table before it starts (3 ms)

Test Suites: 1 passed, 1 total
Tests:       70 skipped, 4 passed, 74 total
Snapshots:   0 total
Time:        2.106 s, estimated 3 s
Ran all test suites matching tests/commands/member/poker.test.ts with tests matching "poker command acabar".
```

`Run saldo` - exit 0

```
      ✓ should refuse someone who is not at the table (3 ms)
      ✓ should refuse someone who already left the table (5 ms)
      ✓ should reply with the chips, buy-in and balance of who asked (1 ms)
      ✓ should show what is in the pot and count it in the balance during a hand (2 ms)
    acabar
      ○ skipped should refuse when there is no table
      ○ skipped should refuse someone who is neither at the table nor an admin
      ○ skipped should void the hand in progress, send the summary and delete the table
      ○ skipped should let a group admin end a table before it starts

Test Suites: 1 passed, 1 total
Tests:       69 skipped, 5 passed, 74 total
Snapshots:   0 total
Time:        5.116 s
Ran all test suites matching tests/commands/member/poker.test.ts with tests matching "poker command saldo".
```

`Run sair` - exit 0

```
      ○ skipped should refuse someone who is not at the table
      ○ skipped should refuse someone who already left the table
      ○ skipped should reply with the chips, buy-in and balance of who asked
      ○ skipped should show what is in the pot and count it in the balance during a hand
    acabar
      ○ skipped should refuse when there is no table
      ○ skipped should refuse someone who is neither at the table nor an admin
      ○ skipped should void the hand in progress, send the summary and delete the table
      ○ skipped should let a group admin end a table before it starts

Test Suites: 1 passed, 1 total
Tests:       61 skipped, 13 passed, 74 total
Snapshots:   0 total
Time:        2.043 s, estimated 5 s
Ran all test suites matching tests/commands/member/poker.test.ts with tests matching "poker command sair".
```

`Run prefix` - exit 0

```
      ✓ should send a warning reply with the raw message for WarningError
      ✓ should send an error reply with the raw message for DangerError (1 ms)
      ✓ should send a generic error reply with details for a plain Error (1 ms)
      ✓ should send a generic error reply with details for a plain TypeError (1 ms)
      ✓ should report "undefined" details when a non-Error value is thrown (1 ms)
      ✓ should crash inside the catch block when null is thrown (1 ms)
      ✓ should return the result of sendWarningReply (1 ms)
      ✓ should return the result of sendErrorReply
      ✓ should propagate a failure of the reply helper itself (1 ms)

Test Suites: 2 passed, 2 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        2.881 s, estimated 12 s
Ran all test suites matching tests/utils/dynamicCommand.test.ts|tests/utils/extractDataFromMessage.test.ts.
```
