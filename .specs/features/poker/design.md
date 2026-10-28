# Poker Design

**Spec**: `.specs/features/poker/spec.md`
**Status**: Approved (user mandou implementar: "certo, pode começar a codar!" - as abordagens alternativas não foram apresentadas)

---

## Architecture Overview

Motor puro e testável separado do I/O do WhatsApp. O comando lê o estado do arquivo, aplica a ação no motor, salva e traduz os eventos do motor em mensagens.

```mermaid
flowchart TD
    U[".poker &lt;sub&gt;"] --> C["commands/member/poker.ts<br/>valida, lock por grupo, I/O"]
    C -->|abrir/entrar/ação/acabar| M["utils/pokerManager.ts<br/>estado + regras + side pots"]
    C -->|nova mão| D["utils/deckOfCards.ts<br/>fetch na Deck of Cards API"]
    M --> H["utils/pokerHand.ts<br/>avaliação de mãos + formatação"]
    M --> F[("assets/poker.json")]
    C -->|grupo| G[Mensagens com marcação]
    C -->|PV| P[Imagens + texto das cartas]
```

## Code Reuse Analysis

| Component | Location | How to Use |
| --- | --- | --- |
| Erros tipados | `src/errors` | `WarningError`/`InvalidParameterError`/`DangerError` para recusas |
| `formatPrice` | `src/utils/menuManager.ts` | Valores em centavos → `R$ 0,10` |
| Padrão de persistência | `src/utils/reminderManager.ts`, `menuManager.ts` | JSON em `assets/`, `mkdirSync` recursivo |
| Regra de admin | `src/middlewares/checkPermission.ts` | Mesma checagem de `groupMetadata` para iniciar/acabar |
| Marcações | `src/commands/member/markAll.ts` | `@<id antes do @>` no texto + JID em `mentions` |

## Components

### deckOfCards
- **Location**: `src/utils/deckOfCards.ts`
- **Interfaces**: `drawCards(count: number): Promise<string[]>` (códigos da API, ex. `0H`); `cardImageUrl(code): string`
- Uma chamada `GET /api/deck/new/draw/?count=N` com timeout de 10 s; lança `DangerError` em falha.

### pokerHand
- **Location**: `src/utils/pokerHand.ts`
- **Interfaces**: `formatCard(code)`, `formatCards(codes)`, `evaluateHand(cards: string[]): HandValue` (melhor de 5 entre 5-7), `compareHands(a, b)`.

### pokerManager
- **Location**: `src/utils/pokerManager.ts`
- **Interfaces**: `getTable/saveTable/deleteTable`, `withTableLock(chatId, fn)`, `parseAmount`, `createTable`, `addPlayer`, `startHand(table, cards)`, `applyAction(table, jid, action, amount?) → PokerEvent[]`, `getOptions(table)`, `finishTable(table) → summary`, `playersWithChips`.

### poker (comando)
- **Location**: `src/commands/member/poker.ts`
- Despacha os subcomandos, aplica o lock por grupo, manda cartas no PV e monta as mensagens a partir dos eventos.

## Data Models

```typescript
type PokerPlayer = {
    jid: string; name: string; buyIn: number; chips: number; // centavos
    cards: string[]; bet: number; committed: number;
    inHand: boolean; folded: boolean; allIn: boolean; acted: boolean; mayRaise: boolean;
};
type PokerTable = {
    chatId: string; minimum: number; smallBlind: number;
    players: PokerPlayer[]; started: boolean; dealer: number; handNumber: number;
    hand: null | { street: "preflop" | "flop" | "turn" | "river"; board: string[]; deck: string[];
                   current: number; currentBet: number; minRaise: number };
};
// assets/poker.json: Record<chatId, PokerTable>
```

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| API do baralho falha/timeout | `DangerError`, mão não começa, blinds não lançados | Aviso no grupo; `.poker iniciar` tenta de novo |
| Imagem da carta falha no PV | ignora a imagem, manda o texto | Jogador recebe só o texto |
| Texto no PV falha | aviso no grupo marcando o jogador | Grupo sabe quem ficou sem cartas |
| Ação inválida / fora da vez | `WarningError` | Reply de aviso, mesa inalterada |
| `poker.json` corrompido | tratado como nenhuma mesa | Mesa perdida, bot segue |

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| --- | --- | --- | --- |
| Prefixo `.` + busca aproximada de aliases | `src/utils/index.ts:135` | Mensagens casuais como `.a` acionam `markall`; `.ok` aciona `poker` | Levar ao user: exigir alias exato para o prefixo `.` (mudança de AD-001) |
| `sendText` espalha o array de marcações no objeto | `src/utils/loadCommonFunctions.ts:16` | Marcações com `sendText` podem não funcionar | Poker usa `socket.sendMessage` direto; bug relatado, não corrigido |
| Comandos concorrentes do mesmo grupo | handlers assíncronos | Duas ações intercaladas corrompem o estado | Lock por grupo (`withTableLock`) |

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Compra de cartas | Todas as cartas da mão numa chamada | Menos rede; mão nunca para no meio por falha da API |
| Raise incompleto (all-in abaixo do mínimo) | `mayRaise=false` para quem já tinha agido | Regra oficial sem reabrir a rodada |
| Restante do pote em empate | Primeiro vencedor à esquerda do botão | Regra oficial |

---

## Alteração: tempo limite, time bank e `.poker sair` (POKER-16..18)

### Arquitetura

O relógio é um timer em memória por grupo; o estado que precisa sobreviver a um reinício (extensões restantes, quem saiu) fica na mesa, em `assets/poker.json`. Ao reiniciar, o bot dá 30 s novos ao jogador da vez (o prazo antigo não é persistido).

```mermaid
flowchart TD
    E["evento turn do motor"] --> C["poker.ts: startClock(chatId, jid)"]
    C --> K["utils/pokerClock.ts<br/>setTimeout: aviso aos 20 s, fim aos 30 s"]
    K -->|fim do tempo| H["poker.ts: onTimeout (com lock)"]
    H -->|extensões > 0| T["pokerManager.useTimeBank → +30 s"]
    H -->|sem extensões| F["applyAction fold → anuncia"]
    H --> S["utils/activeSocket.ts<br/>socket atual (troca a cada reconexão)"]
    L["loader.listenToMessages"] -->|setActiveSocket| S
    I["index.ts após conectar"] --> R["poker.ts: resumePokerClocks"]
```

### Componentes

- `src/utils/activeSocket.ts`: `setActiveSocket(socket)` / `getActiveSocket()`. O loader registra cada socket novo; timers usam sempre o atual, então funcionam depois de uma reconexão.
- `src/utils/pokerClock.ts`: `startClock(chatId, durationMs, { onWarning, onExpire })` e `stopClock(chatId)`. Um relógio por grupo; começar um novo cancela o anterior.
- `pokerManager.ts`: `TIME_BANK_EXTENSIONS = 3`, campo `timeBank` no jogador, `useTimeBank(table, jid)`; campo `left`, `leaveTable(table, jid) → PokerEvent[]`; quem saiu não recebe cartas, não é botão e aparece no resumo com `left: true`.
- `poker.ts`: linha do relógio na mensagem de vez; liga o relógio a cada evento `turn` e desliga quando a mão ou a mesa acaba; `onTimeout` (extensão ou fold); subcomando `sair`; `resumePokerClocks()` chamado em `index.ts`.

### Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Socket nos timers | Referência global ao socket atual, atualizada pelo loader | O socket capturado no comando morre numa reconexão (mesmo problema dos lembretes) |
| Relógio entre ações | Só reinicia quando o motor emite `turn` | Um `sair` de quem não é da vez não pode zerar o relógio de quem é |
| Saída fora da vez | Marca fold sem mover a vez; só encerra a mão se sobrar um ativo | A vez continua de quem estava jogando |
