# Documentação dos Comandos 📚🤖

Este é o índice geral da documentação de todos os comandos disponíveis no bot Make List. Cada comando possui sua própria documentação detalhada com exemplos, aliases, formatos e recursos técnicos.

## Comandos Disponíveis

### 🍽️ [Cardápio](./cardapio.md)
**Comando:** `cardapio`, `produtos` (somente admins)  
**Descrição:** Lista, adiciona, edita ou remove os itens e preços da enquete do `/pedido`. Alterações ficam bloqueadas enquanto houver pedido em aberto.

---

### 🎲 [Sortear Times](./drawTeams.md)
**Comando:** `drawteams`  
**Descrição:** Sorteia times de forma equilibrada a partir de uma lista de participantes, com suporte a jogadores sementes (capitães).

---

### 🛒 [Pedido](./pedido.md)
**Comando:** `pedido`, `lidineide`; para encerrar, `pedido-encerrar`, `lidineide-encerrar`  
**Descrição:** Abre uma enquete com os itens do cardápio por um tempo definido e, ao encerrar, envia o resumo dos itens e o total de cada pessoa.

---

### 📢 [Marcar Todos](./markAll.md)
**Comando:** `markall`, `all`, `todes`  
**Descrição:** Marca (menciona) todos os membros de um grupo de uma só vez, útil para anúncios importantes.

---

### 🏓 [Ping](./ping.md)
**Comando:** `ping`  
**Descrição:** Verifica a conectividade e responsividade do bot, confirmando que está online e funcionando.

---

### 📝 [Template de Lista](./templateList.md)
**Comando:** `racha`, `templatelist`  
**Descrição:** Cria templates personalizados para organizar eventos, especialmente rachas esportivos, com informações como local, valor e horário.

---

## Estrutura da Documentação

Cada comando possui documentação seguindo esta estrutura padronizada:

- **Descrição do comando** - Explicação clara do que o comando faz
- **Exemplos** - Casos de uso práticos com entrada e saída esperada
- **Aliases** - Todos os nomes alternativos para invocar o comando
- **Formatos dos parâmetros** - Quando aplicável, como usar parâmetros corretamente
- **Como funciona** - Explicação técnica do fluxo de execução
- **Arquivos** - Localização dos arquivos relacionados ao comando
- **Recursos técnicos** - Lista de funcionalidades e características técnicas

## Como Usar os Comandos

1. **Prefixo**: Todos os comandos devem ser precedidos pelo prefixo configurado (geralmente `/`)
2. **Grupos vs Privado**: Alguns comandos funcionam apenas em grupos (como `markall`)
3. **Parâmetros**: Comandos que aceitam parâmetros têm formatos específicos documentados
4. **Ajuda**: Alguns comandos oferecem ajuda interna (ex: `--help`)

## Testando os Comandos 🧪

O projeto possui testes unitários abrangentes para todos os comandos disponíveis, garantindo qualidade e confiabilidade do código.

### Executando os Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar apenas o build (verificar TypeScript)
npm run build
```

### Cobertura de Testes

- **ping**: Testa conectividade e resposta do bot
- **markAll**: Testa menção de membros em grupos  
- **templateList**: Testa criação de templates com parâmetros
- **drawTeams**: Testa sorteio de times e distribuição de jogadores

### Framework Utilizado

- **Jest**: Framework de testes principal
- **TypeScript**: Suporte completo a tipos
- **Mocks**: Simulação das funções do WhatsApp para testes isolados

### Estrutura dos Testes

```
tests/
├── commands/
│   └── member/
│       ├── ping.test.ts
│       ├── markAll.test.ts
│       ├── templateList.test.ts
│       └── drawTeams.test.ts
├── mocks/
│   └── commonFunctions.ts
└── setup.ts
```

## Contribuindo

Para adicionar documentação de novos comandos:

1. Crie um novo arquivo `.md` na pasta `docs/`
2. Siga a estrutura padrão apresentada nos exemplos existentes
3. Adicione uma entrada neste arquivo índice
4. Mantenha a documentação atualizada conforme o comando evolui

---

*Documentação gerada para o bot Make List - Sistema de comandos para WhatsApp*