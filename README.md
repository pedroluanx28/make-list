# Make List Bot 🤖

Bot para WhatsApp desenvolvido em TypeScript que oferece comandos úteis para organização de grupos e eventos.

## Características

- ✅ **Comandos de produtividade** para grupos do WhatsApp  
- ✅ **Sorteio de times** com distribuição equilibrada
- ✅ **Templates personalizáveis** para eventos
- ✅ **Menção em massa** para comunicados importantes
- ✅ **Testes unitários** com 100% de cobertura nos comandos
- ✅ **TypeScript** para maior confiabilidade

## Comandos Disponíveis

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `/ping` | `ping` | Verifica conectividade do bot |
| `/markall` | `markall`, `all`, `todes` | Marca todos os membros do grupo |
| `/racha` | `racha`, `templatelist` | Cria templates para eventos |
| `/drawteams` | `drawteams` | Sorteia times de forma equilibrada |

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

## Testando

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar com cobertura
npm run test:coverage
```

### Cobertura dos Testes

O projeto mantém **100% de cobertura** em todos os comandos:

- **ping**: 100% cobertura
- **markAll**: 100% cobertura  
- **templateList**: 100% cobertura
- **drawTeams**: 100% cobertura

## Estrutura do Projeto

```
src/
├── commands/
│   └── member/          # Comandos de membros
├── @types/              # Definições de tipos
├── errors/              # Classes de erro personalizadas
├── middlewares/         # Middlewares do bot
├── utils/              # Utilitários gerais
├── config.ts           # Configurações
├── connection.ts       # Conexão WhatsApp
└── index.ts           # Ponto de entrada

tests/
├── commands/           # Testes dos comandos
├── mocks/             # Mocks para testes
└── setup.ts          # Configuração dos testes
```

## Tecnologias

- **TypeScript** - Linguagem principal
- **@whiskeysockets/baileys** - Biblioteca para WhatsApp Web
- **Jest** - Framework de testes
- **Node.js** - Runtime

## Documentação

Documentação detalhada dos comandos disponível em [`docs/README.md`](./docs/README.md).

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Implemente os testes para a nova funcionalidade
4. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
5. Push para a branch (`git push origin feature/nova-feature`)
6. Abra um Pull Request

### Padrões de Desenvolvimento

- **Testes obrigatórios** para novos comandos
- **Cobertura mínima de 100%** nos comandos
- **TypeScript** para tipagem forte
- **Documentação** atualizada para novas features

## Licença

ISC