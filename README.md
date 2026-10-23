# Make List Bot 🤖

Bot para WhatsApp desenvolvido em TypeScript que oferece comandos úteis para organização de grupos e eventos.

## Características

- ✅ **Comandos de produtividade** para grupos do WhatsApp
- ✅ **Sorteio de times** com distribuição equilibrada
- ✅ **Templates personalizáveis** para eventos
- ✅ **Menção em massa** para comunicados importantes
- ✅ **Pedidos por enquete** com cardápio configurável e resumo de totais
- ✅ **Lembretes** persistentes, que sobrevivem a reinicializações
- ✅ **Testes unitários** com 100% de cobertura nos comandos
- ✅ **TypeScript** para maior confiabilidade

## Comandos Disponíveis

| Comando | Aliases | Permissão | Descrição |
|---------|---------|-----------|-----------|
| `/comandos` | `comandos`, `ajuda`, `help` | membro | Lista os comandos que você pode usar |
| `/ping` | `ping` | membro | Verifica conectividade do bot |
| `/markall` | `markall`, `all`, `todes` | membro | Marca todos os membros do grupo |
| `/racha` | `racha`, `templatelist` | membro | Cria templates para eventos |
| `/drawteams` | `drawteams` | membro | Sorteia times de forma equilibrada |
| `/pedido` | `pedido`, `lidineide` | membro | Abre uma enquete de pedido com o cardápio |
| `/pedido-encerrar` | `pedido-encerrar`, `lidineide-encerrar` | membro | Encerra o pedido ativo e envia o resumo |
| `/cardapio` | `cardapio`, `produtos` | admin | Lista e edita os itens do cardápio do pedido |
| `/lembrete` | `lembrete`, `reminder`, `lembrar` | membro | Cria um lembrete (`30min`, `2h`, `1d`, `1w`) |
| `/lembretes` | `lembretes`, `reminders`, `listarlembretes` | membro | Lista seus lembretes ativos |
| `/deletarlembrete` | `deletarlembrete`, `deletereminder`, `removerlembrete` | membro | Remove um lembrete pelo ID |

Detalhes de cada comando em [`docs/README.md`](./docs/README.md).

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar em desenvolvimento
npm run dev

# Executar forçando rebuild
npm run dev:force
```

Na primeira execução o bot pede o número de telefone no terminal e exibe um código de pareamento. As credenciais ficam em `assets/auth/baileys/` (ignorado pelo git).

## Testando

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar com cobertura
npm run test:coverage
```

Todo comando em `src/commands/` deve ter 100% de cobertura. Rode `npm run test:coverage` para conferir.

## Estrutura do Projeto

```
src/
├── commands/
│   ├── admin/           # Comandos restritos a admins do grupo
│   ├── member/          # Comandos liberados para todos
│   └── _sample.ts       # Template para novos comandos
├── @types/              # Tipos globais (Command, CommonFunctions)
├── errors/              # Classes de erro personalizadas
├── middlewares/         # Middlewares do bot
├── utils/               # Utilitários e estado (lembretes, pedidos, cardápio)
├── config.ts            # Configurações
├── connection.ts        # Conexão WhatsApp
└── index.ts             # Ponto de entrada

tests/                   # Espelha src/
├── commands/            # Testes dos comandos
├── middlewares/         # Testes dos middlewares
├── utils/               # Testes dos utilitários
├── mocks/               # Mocks para testes
└── setup.ts             # Configuração dos testes
```

## Tecnologias

- **TypeScript** - Linguagem principal
- **@whiskeysockets/baileys** - Biblioteca para WhatsApp Web
- **Jest** - Framework de testes
- **Node.js** - Runtime

## Documentação

Documentação detalhada dos comandos disponível em [`docs/README.md`](./docs/README.md).

## Contribuindo

1. Crie uma branch no padrão `tipo/descricao-curta` (ex: `feat/comando-enquete`, `fix/lembrete-duplicado`)
2. Implemente a mudança com testes
3. Faça commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em português (ex: `feat(pedido): permite encerrar pelo admin`)
4. Abra um Pull Request para `main`

### Checklist para novos comandos

- [ ] Arquivo em `src/commands/<permissao>/` a partir do `_sample.ts`
- [ ] Testes em `tests/commands/<permissao>/` com 100% de cobertura
- [ ] Página em `docs/` seguindo [`docs/_template.md`](./docs/_template.md)
- [ ] Entrada no índice `docs/README.md` e na tabela de comandos deste README

## Licença

ISC
