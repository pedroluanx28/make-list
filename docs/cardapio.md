# Cardápio 🍽️🤖

O comando `cardapio` configura os itens e preços usados na enquete do `/pedido`. Permite listar, adicionar, editar e remover produtos.

## Descrição do Comando

Gerencia o cardápio do pedido, que é salvo em `assets/menu.json` e vale para todos os grupos. Enquanto o arquivo não existir, é usado o cardápio padrão.

- **Somente administradores** (ou o dono) do grupo podem usar o comando. Ele não funciona em conversas privadas.
- **Listar** está sempre disponível.
- **Adicionar, editar e remover** ficam bloqueados enquanto houver um pedido em aberto em qualquer grupo, porque os votos e os totais dependem dos itens da enquete.

## Exemplos

**Listar o cardápio:**
```
/cardapio
```
```
🍽️ Cardápio do pedido:

1. cuscuz — R$ 7,00
2. pão de carne — R$ 6,00
...
```

**Adicionar um item:**
```
/cardapio adicionar tapioca de queijo | 8,50
```

**Editar nome e preço do item 2:**
```
/cardapio editar 2 | pão de carne grande | 7,50
```

**Editar só o preço (deixe o nome vazio):**
```
/cardapio editar 1 | | 8
```

**Editar só o nome:**
```
/cardapio editar 1 | cuscuz recheado
```

**Remover o item 3:**
```
/cardapio remover 3
```

## Aliases

- `cardapio`, `produtos`
- Ações: `adicionar`/`add`, `editar`/`atualizar`/`edit`, `remover`/`deletar`/`del`

## Formatos dos Parâmetros

- **Separador**: os campos são separados por `|`
- **Número do item**: a posição mostrada em `/cardapio`
- **Preço**: `7`, `7,5`, `7,50`, `7.50` ou `R$ 7,50`; precisa ser maior que zero e ter no máximo 2 casas decimais
- **Nome**: até 100 caracteres, sem repetir outro item (sem diferenciar maiúsculas de minúsculas)

## Regras

- O cardápio precisa ter **entre 2 e 12 itens**, que é o limite de opções de uma enquete do WhatsApp
- Cada pedido guarda uma cópia do cardápio do momento em que foi criado

## Como Funciona

1. **Permissão**: o `checkPermission` confirma que quem enviou é admin ou dono do grupo
2. **Ação**: a primeira palavra define a ação; sem ação, o cardápio é listado
3. **Bloqueio**: para alterações, verifica se existe algum pedido aberto (`hasOpenOrder`)
4. **Validação e gravação**: o `menuManager` valida as regras e salva em `assets/menu.json`
5. **Resposta**: confirma a alteração e mostra o cardápio atualizado

## Arquivos

- `src/commands/admin/cardapio.ts` - Implementação do comando
- `src/utils/menuManager.ts` - Leitura, validação e gravação do cardápio
- `src/utils/pedidoManager.ts` - Pedidos ativos (`hasOpenOrder`)
- `tests/commands/admin/cardapio.test.ts` - Testes

## Recursos Técnicos

- ✅ Cardápio persistido em arquivo, mantido entre reinícios do bot
- ✅ Restrito a administradores do grupo
- ✅ Bloqueio de alterações durante pedidos em aberto
- ✅ Validação de preço, nome duplicado e limites da enquete
