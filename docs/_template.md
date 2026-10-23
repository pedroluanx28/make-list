# Nome do Comando 🔖🤖

<!--
Template para documentar um comando. Copie para docs/<nomeDoComando>.md,
substitua os trechos de exemplo e apague este comentário.
Depois, adicione uma entrada em docs/README.md e na tabela do README.md da raiz.
-->

O comando `nome` faz X para que o grupo consiga Y. (Uma ou duas frases explicando para quem e para quê.)

## Descrição do Comando

O que o comando faz, quem pode usar (membro ou admin) e se funciona fora de grupos.

## Exemplos

**Uso básico:**
```
/nome argumento
```

**Resposta esperada:**
```
🤖 Mensagem que o bot envia
```

## Aliases

- `nome`
- `apelido`

## Formatos dos Parâmetros

- **Comando**: `/nome <obrigatorio> [opcional]`
- **`<obrigatorio>`**: o que é e quais valores aceita
- **Separadores**: os argumentos podem ser separados por `|`, `/` ou `\`

## Como Funciona

1. **Validação**: o que é verificado e qual erro é exibido
2. **Processamento**: o que o comando faz
3. **Resposta**: o que é enviado ao grupo

## Arquivos

- `src/commands/<permissao>/nome.ts` - Implementação principal do comando
- `tests/commands/<permissao>/nome.test.ts` - Testes

## Recursos Técnicos

- ✅ Característica relevante (persistência, limites, permissões etc.)
