# Handoff: feature poker (sessão de 2026-10-28)

Resumo de tudo que foi feito e aprendido na sessão anterior, para a próxima sessão continuar sem perder nada. Leia inteiro antes de agir.

## Prompt sugerido para a nova sessão

> Leia `.specs/features/poker/handoff.md` inteiro, depois `.specs/STATE.md`, `.specs/features/poker/spec.md` e `.specs/features/poker/context.md`. Use a skill `tlc-spec-driven` (do MCP `agent-skills`) e continue a feature poker de onde parou, seguindo "Próximos passos".

---

## 1. Estado atual (onde paramos)

- **Branch:** `feat/poker`, criada a partir de `main` (b8f4944). Nada commitado ainda.
- **Arquivos não commitados:** `.specs/STATE.md`, `.specs/features/poker/spec.md`, `.specs/features/poker/context.md`, `.specs/features/poker/handoff.md` (este).
- **Nenhum código do poker foi escrito.** Nenhum arquivo de `src/` ou `tests/` foi alterado.
- **Fase da skill:** Specify concluído em conteúdo e aprovado pelo user (`**Approved**: 2026-10-28 - user: "certo, entao pode dale"`). Falta adaptar o spec ao formato completo da skill (ver Próximos passos). Design, Tasks e Execute ainda não começaram.
- **Escopo pela skill:** **Complex** (domínio novo, estado persistido, API externa, máquina de estados): spec completa + discuss + design com 2-3 abordagens + tasks formais + execute com Verifier.

## 2. Próximos passos (em ordem)

1. **Ativar a skill `tlc-spec-driven`** pelo MCP `agent-skills` (configurado no escopo local; nesta sessão nova as ferramentas dele devem aparecer). Ler o `SKILL.md` e as referências da fase atual até o fim.
2. **Scripts da skill:** o auto mode do Claude Code bloqueou rodar os scripts Python baixados (`[Code from External]`). Peça ao user para liberar (regra de permissão para `python3 <skill-dir>/scripts/*.py`) ou para ele rodar com `! python3 ...`. Sem os scripts, a skill manda fazer as mesmas checagens lendo os artefatos. A sessão anterior baixou a skill em `/tmp/.../scratchpad/tlc/repo/packages/skills-catalog/skills/(development)/tlc-spec-driven`, mas o scratchpad é por sessão; baixe de novo se precisar: repo `tech-leads-club/agent-skills`, caminho `packages/skills-catalog/skills/(development)/tlc-spec-driven`.
3. **Fechar o Specify no formato da skill** (ver seção 4), rodar `validate_spec.py poker`. Se o conteúdo mudar de substância, apresentar de novo ao user e pedir nova aprovação. Mudança só de forma (dividir critérios, varredura de dimensões com N/A) mantém a aprovação.
4. **Design** (`references/design.md`): ler `.specs/STATE.md` Decisions (AD-001 está ativo), apresentar 2-3 abordagens com recomendação e **confirmar com o user** antes de detalhar. Preencher Risks & Concerns (ver seção 7). Rascunho de arquitetura na seção 8.
5. **Tasks** (`references/tasks.md`): Test Coverage Matrix, Gate Check Commands, tasks atômicas com `Tests`/`Gate`/`Commit`, `## Checks` com uma prova por critério, `**Build**:` e `**Mutations**: 3`. Rodar `validate_tasks.py poker`. **Parar para aprovação do user** (segunda parada humana).
6. **Execute** (`references/implement.md`, ler inteiro antes): `validate_tasks.py poker --execute`; se passar de ~8 tasks, **oferecer** sub-agentes (nunca disparar sem o user aceitar). Uma task = um commit atômico, `check_commit.py` antes de cada commit. Depois da última: `check_proofs.py`, Verifier independente (sempre), `validate_verification.py`, lições (`lessons.py`).

## 3. Regras da skill tlc-spec-driven (resumo fiel)

- Fluxo: **Specify → Design → Tasks → Execute**, profundidade ajustada pela complexidade. Specify e Execute sempre.
- **Perguntar e parar para aprovação.** Toda decisão que é do user (escopo, comportamento do produto) é perguntada antes de apresentar o spec; uma suposição nunca substitui uma pergunta. As duas paradas humanas são: aprovar o spec e aprovar as tasks. Cada aprovação é escrita como `**Approved**: <data> - user: "<palavras dele>"`; nunca escrever uma aprovação que o user não deu. Cada resposta do user vai para o arquivo no mesmo turno (o chat não sobrevive a uma compactação).
- **Fatos você pesquisa; decisões você pergunta.** Não perguntar o que dá para descobrir lendo o código.
- Critérios em **EARS** (WHEN/WHILE/WHERE/IF/ubiquitous + SHALL), **um comportamento por critério**, valores concretos.
- Para Complex: **varredura das dimensões implícitas**, cada uma vira requisito ou `N/A because ...`: validação/limites de entrada; falha/falha parcial; idempotência/retry/duplicados; autorização e rate limit; concorrência/ordem; ciclo de vida dos dados; observabilidade; falha de dependência externa; integridade das transições de estado.
- **Closure gate:** reler o pedido do user frase por frase; cada frase cai num critério, numa linha de Out of Scope ou numa pergunta.
- Testes derivam dos critérios do spec e verificam o resultado definido no spec, nunca espelham a implementação.
- O gate (test runner) decide se a task acabou. Um commit atômico por task, com `tasks.md` marcado antes. Nunca agrupar tasks. Nunca enfraquecer, pular ou apagar testes.
- Todo critério tem uma check em `## Checks`, e toda check uma prova (comando que seleciona um teste específico: arquivo + `-t "nome"`).
- Depois da última task: `check_proofs.py` uma vez no HEAD, depois um **Verifier** novo (autor ≠ verificador) sempre, com 3 mutações por padrão. Pronto = todo achado fechado por um commit e `validate_verification.py` saindo 0.
- Regras que mudam o que o user vê rodam numa camada que os testes alcançam.
- **Raio de ação:** aprovar spec/tasks autoriza só implementação e commits locais. `git push`, PR, deploy precisam de autorização explícita.
- Artefatos criados só quando a fase produz conteúdo (não criar `design.md`/`tasks.md` vazios).
- Decisões de projeto (difíceis de reverter, surpreendentes, com trade-off real) viram `AD-NNN` em `.specs/STATE.md`. Escrita no STATE.md é sempre por seção (Decisions só cresce; Handoff é sobrescrito).
- Lições: carregar só as `confirmed` no Specify/Design (`lessons.py list --status confirmed`). Hoje não há nenhuma confirmada; a candidata L-001 (aliases mudando o destino de inputs curtos) é relevante para o alias `poker`, mas candidata não é usada como regra.
- Escrita: direta, decidida, frases curtas, sem travessão como conector; títulos de seção em inglês, texto em pt-BR, identificadores nunca traduzidos.

## 4. O que falta no spec para o formato da skill

O `spec.md` já tem as seções obrigatórias, IDs POKER-01..12 e SHALL em todos os critérios. Falta:

- **Dividir critérios que juntam vários comportamentos** (ex.: "Montar a mesa" AC5 junta 6 recusas; "Rodadas" AC3 junta check inválido e raise inválido; "Distribuir" AC2 junta compra na API e envio no PV). Um comportamento por critério.
- **Varredura das dimensões implícitas** (seção 3). Pontos já identificados:
  - Concorrência: dois comandos do mesmo grupo podem se intercalar nos `await` (envio de mensagens, chamada à API). Precisa de requisito de processamento serializado por mesa (fila/lock por grupo).
  - Falha da API externa: já coberta (Distribuir AC7); definir timeout concreto.
  - Duplicados: a mesma ação enviada duas vezes (a 2ª deve ser recusada porque a vez já passou).
  - Falha no envio do PV: definir comportamento concreto.
  - Observabilidade: `console.log`/`console.error` como o resto do repo, ou N/A.
- **Critérios das edge cases sem palavra EARS** (ex.: "Jogadores sem fichas SHALL ficar de fora" → "WHILE um jogador tem 0 fichas the bot SHALL ...").
- Opcional: seção `## Sources` citando a Deck of Cards API.

## 5. Decisões do user (resumo; detalhes com as palavras dele em `context.md`)

- Texas Hold'em no-limit. Prefixo `/` e `.` para todos os comandos (AD-001).
- `.poker abrir [minimo]` (default 0.10), `.poker entrar <nome> <buyin>`, `.poker iniciar`, `.poker acabar`, `.poker ajuda`, ações `.poker check|call|raise [valor]|fold|allin`.
- Ordem de entrada = assentos. 1ª mão: 1º jogador botão, 2º small, 3º big; gira no sentido horário. Pré-flop começa à esquerda do big.
- Small = metade do mínimo, big = mínimo, lançados automaticamente.
- Check = passar sem apostar (regra oficial, aceita pelo user). Fold = sair da mão.
- Raise: o jogador escolhe o valor; sem valor, o padrão é o dobro da aposta anterior.
- Ao iniciar: "Distribuindo cartas..." no grupo; cartas no PV como imagem da Deck of Cards API + texto `[10♥️] [6♥️]`; só texto se a imagem falhar. Figurinha fora do escopo.
- Mensagem de início: `Mesa iniciada!` + `@jogador começa!` + uma linha por ação possível.
- Flop/turn/river em texto no grupo.
- Fim: quando só um jogador tem fichas OU `.poker acabar`. Resumo com quanto cada um ficou, depois apagar a mesa do arquivo.
- Estado da mesa em arquivo dentro do projeto (`assets/poker.json`), limpo ao fim. Nada de histórico.

## 6. Fatos técnicos do código (verificados)

- **Prefixo:** `PREFIX = "/"` em `src/config.ts`. `verifyPrefix` (`src/middlewares/index.ts`) compara `PREFIX === prefix`. `extractDataFromMessage` (`src/utils/index.ts`) tira o prefixo com `new RegExp(`^[${PREFIX}]+`)` e usa `command.charAt(0)` como prefixo. Para AD-001: criar uma lista de prefixos e usá-la nos dois lugares. `PREFIX` é usado em ~15 strings de `usage` e mensagens; pode continuar como o prefixo de exibição.
- **Argumentos:** `args` é separado por `\`, `|` e `/`, não por espaço. `.poker entrar Pedro 50` chega com `args = ["entrar Pedro 50"]`. Usar `fullArgs.trim().split(/\s+/)`.
- **`userJid`** vem de `webMessage.key.participant` (sem o sufixo `:NN`). Pode ser um LID (`...@lid`). É o JID usado para mandar no PV e para marcar (`mentions`).
- **`CommonFunctions`** (`src/@types/`, tipos globais sem import) tem `socket`, então dá para usar `socket.sendMessage(jid, { image: { url }, caption })`, `{ text, mentions }` etc.
- **Bug existente em `sendText`** (`src/utils/loadCommonFunctions.ts`): faz `...mentions` dentro do objeto da mensagem (espalha o array). Não corrigir sem perguntar (fora do escopo); para marcações, `sendReply(text, mentions)` está correto, ou usar `socket.sendMessage` direto.
- **Permissão de admin:** `checkPermission` (`src/middlewares/checkPermission.ts`) usa `socket.groupMetadata(remoteJid)`: `participant.admin === "admin"`, ou dono se `owner === userJid` ou `admin === "superadmin"`. Reaproveitar a mesma regra para "quem pode iniciar/acabar".
- **Dinheiro:** o repo já usa centavos inteiros (`MenuItem.price`) e `formatPrice(cents)` em `src/utils/menuManager.ts` gera `R$ 7,00`.
- **Padrão de persistência:** `src/utils/reminderManager.ts` (`assets/reminders.json`, `existsSync`/`readFileSync`/`writeFileSync`, `mkdirSync` recursivo) e `menuManager.ts` (valida o JSON e lança `DangerError` se estiver inválido).
- **Erros tipados:** `InvalidParameterError`, `WarningError`, `DangerError` de `src/errors`; o `dynamicCommand` converte em reply de aviso ou erro. O CLAUDE.md pede usar esses erros em comandos novos.
- **Estado em memória com reserva:** `pedidoManager.ts` usa `reserveOrder` e `pendingOrders` para evitar duas aberturas simultâneas; é a referência para o lock por mesa.
- **tsconfig:** `target: es6`, `module: commonjs`. `fetch` é global no Node 22 (sem dependência nova).
- **Ordem de descoberta dos comandos:** `findCommandImport` faz 3 passadas (alias exato, alias que começa com o input, alias que contém o input), `member` antes de `admin` antes de `owner`, e arquivos em ordem alfabética. Um alias novo `poker` pode mudar o destino de inputs curtos (ex.: `/k`, `/er`, `/ok`). Verificar antes e depois com `npm run build` + o script `node -e` da skill `/new-command` do repo, e registrar no spec (lição L-001).

## 7. Regras do repo (CLAUDE.md) que se aplicam

- Identificadores em inglês; textos para o usuário, comentários, docs, commits e PRs em pt-BR.
- Branch `tipo/descricao-curta` (já em `feat/poker`). Nunca commitar na `main`. Conventional Commits em pt-BR com escopo, ex.: `feat(poker): ...`. Sem commits `wip`.
- **Nunca commitar `assets/`** (credenciais, `wa-logs.txt` com telefones/JIDs, JSONs) nem `.js` compilado em `tests/`.
- Definition of Done de comando novo: arquivo em `src/commands/member/` a partir de `_sample.ts`; testes no caminho espelhado com **100% de cobertura** do arquivo do comando (`npx jest --coverage <arquivo>`); `docs/poker.md` seguindo `docs/_template.md`; entrada em `docs/README.md` e na tabela de comandos do `README.md`; `npm run build` e `npm test` passando.
- Testes: `createMockCommonFunctions(overrides)` de `tests/mocks/commonFunctions.ts`; `fs` mockado em memória com um `Map` (ver `tests/commands/admin/cardapio.test.ts`), **nunca tocar o `assets/` real**; timers com `jest.useFakeTimers({ now })` + `advanceTimersByTimeAsync`; **qualquer teste que importe código que depende de `@whiskeysockets/baileys` precisa de `jest.mock`** (Baileys 6.7.24 é ESM e o Jest roda CommonJS). Mockar `fetch` para a Deck of Cards API.
- Comandos só passam a valer depois do `tsc` (o bot carrega `dist/commands/*.js`); usar `npm run dev:force` se sobrar `.js` velho em `dist/`.
- Hook PostToolUse roda `tsc --noEmit` depois de editar `src/`. Agentes do repo: `command-reviewer` (revisa contra a DoD) e `test-writer`. Skill `/ship` para commit e PR (só com autorização do user).

## 8. Rascunho de design (NÃO aprovado; levar como uma das abordagens)

- `src/utils/deckOfCards.ts`: `drawCards(count)` → `GET https://deckofcardsapi.com/api/deck/new/draw/?count=N` (cria baralho novo embaralhado e compra numa chamada só). Comprar `2 × jogadores + 5` no início da mão e guardar no estado.
- `src/utils/pokerHand.ts`: avaliador puro (melhor mão de 5 entre 7, nome em pt-BR, comparação, empate) + formatação de carta (`0H` → `[10♥️]`).
- `src/utils/pokerManager.ts`: estado por grupo em `assets/poker.json`, motor puro (aplicar ação, fim de rodada, side pots, showdown, giro do botão) e lock por grupo.
- `src/commands/member/poker.ts`: despacha os subcomandos e faz o I/O (grupo, PV, marcações).
- Valores em centavos. Prova de que o raise padrão (dobro da aposta atual) sempre satisfaz o raise mínimo: `atual = anterior + aumento`, `mínimo = atual + aumento ≤ 2 × atual`, porque `aumento ≤ atual`.

## 9. Deck of Cards API (verificado com curl em 2026-10-28)

- `GET /api/deck/new/shuffle/?deck_count=1` → `{"success": true, "deck_id": "...", "remaining": 52, "shuffled": true}`.
- `GET /api/deck/new/draw/?count=3` → `{"success": true, "deck_id": "...", "cards": [{"code": "6H", "image": "https://deckofcardsapi.com/static/img/6H.png", "value": "6", "suit": "HEARTS"}, ...]}`.
- **O 10 tem código `0`** (ex.: `0S`, `0H`). Naipes: `S` ♠, `H` ♥, `D` ♦, `C` ♣. Valores: `ACE`, `KING`, `QUEEN`, `JACK`, `10`..`2`.
- Imagem: `https://deckofcardsapi.com/static/img/<code>.png` responde `200 image/png`.

## 10. Ambiente e operação do bot (aprendido nesta sessão)

- WSL2, Node v22.22.2. `npm install` feito (avisou 8 vulnerabilidades: 6 baixas, 1 alta, 1 crítica; não tratadas). `npm run build` passa. Pasta `assets/temp/` criada (o bot quebra sem ela, porque o pino grava `assets/temp/wa-logs.txt`).
- **Bot pareado** com o número do dono do bot (informado no terminal na primeira execução); credenciais em `assets/auth/baileys/`. Ao iniciar não pede número de novo. Para rodar: `npm run dev` num terminal do user (ou `pm2`). O processo que estava rodando dentro da sessão anterior morre quando ela fecha.
- **Bug de pareamento em `src/connection.ts`:** o bot chama `requestPairingCode` antes do WebSocket abrir. Digitando o número à mão, a demora esconde o problema; mandando por pipe dá `Connection Closed` (428). Contorno usado: esperar ~8 s antes de mandar o número (`(sleep 8; echo NUMERO; tail -f /dev/null) | node ./dist/index.js`). O user pode querer a correção numa branch `fix/` (foi oferecida, não pedida).
- A 1ª tentativa de pareamento falhou com `Invalid buffer` dentro da Baileys (notificação `link_code_companion_reg` sem `link_code_pairing_ref`); a 2ª passou sem mudar código. Depois do `pair-success`, o erro `stream:error code=515` é o reinício normal e o bot reconecta sozinho. Causa da 1ª falha desconhecida.
- Log detalhado: trocar o nível do pino para `trace` só no `dist/connection.js` (um `npm run build` desfaz). Os logs `trace` contêm chaves e dados sensíveis: limpar `assets/temp/wa-logs.txt` depois.
- Armadilha: `pkill -f "node ./dist/index.js"` dentro de um comando que contém esse texto mata o próprio shell (exit 144).
- Permissões: ler `assets/auth/` (credenciais) foi negado; rodar scripts Python baixados da internet foi bloqueado pelo auto mode.
- MCP `agent-skills` adicionado com `claude mcp add agent-skills --scope local -- npx -y @tech-leads-club/agent-skills-mcp` (fica em `~/.claude.json`, não no repo). Remover: `claude mcp remove agent-skills -s local`.
- O user pede para usar o MCP Context7 para documentação de bibliotecas (regra global dele): consultar antes de usar APIs do Baileys (envio de imagem por URL, `mentions`, envio para JID `@lid`).

## 11. SDD já existente no repo

- `.specs/features/comandos/` (spec + validation, PASS em 2026-10-23) foi feito com esta mesma skill e serve de exemplo de formato.
- `.specs/LESSONS.md` e `.specs/lessons.json` são mantidos pelo `lessons.py` da skill: **não editar à mão**.
