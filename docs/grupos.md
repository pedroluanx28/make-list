# Grupos autorizados 🔒🤖

O comando `grupos` gerencia em quais grupos o bot responde a comandos. Grupos fora da lista são ignorados silenciosamente — o bot não envia nem erro, nem aviso.

## Descrição do Comando

Só o operador do bot pode usar este comando — quem mandou a mensagem precisa ser o número configurado em `BOT_NUMBER` (`src/config.ts`), **independente** de ser admin/dono do grupo onde o comando foi digitado. Qualquer outra pessoa recebe "Só o operador do bot pode gerenciar os grupos autorizados." Funciona em grupos e no privado (listar funciona nos dois; autorizar/desautorizar precisa ser dentro do grupo-alvo).

O operador sempre consegue falar com qualquer grupo, mesmo não autorizado — é assim que dá para autorizar um grupo novo sem travar a si mesmo.

## Exemplos

**Listar os grupos autorizados:**
```
/grupos
```
```
🤖 ✅ *Grupos autorizados:*

1. 123456789-987654321@g.us
```

**Autorizar o grupo atual:**
```
/grupos autorizar
```
```
🤖 Grupo autorizado! O bot já pode responder aqui.
```

**Remover a autorização do grupo atual:**
```
/grupos desautorizar
```
```
🤖 Autorização removida. O bot não vai mais responder aqui.
```

## Aliases

- `grupos`

## Formatos dos Parâmetros

- **Comando**: `/grupos [ação]`
- **(sem ação)**: lista os grupos autorizados
- **`autorizar` / `liberar`**: autoriza o grupo onde o comando foi digitado (precisa ser um grupo)
- **`desautorizar` / `remover`**: remove a autorização do grupo onde o comando foi digitado (precisa ser um grupo)

## Como Funciona

1. **Validação**: confere se quem mandou é o operador do bot (`BOT_NUMBER`); se não for, recusa antes de olhar a ação.
2. **Processamento**: lê/escreve `assets/authorizedGroups.json` através de `src/utils/authorizedGroups.ts`.
3. **Efeito**: toda execução de comando passa por `dynamicCommand` (`src/utils/dynamicCommand.ts`), que ignora silenciosamente qualquer comando mandado em um grupo fora da lista (exceto quando quem mandou é o próprio operador).

## Arquivos

- `src/commands/member/grupos.ts` - Implementação do comando
- `src/utils/authorizedGroups.ts` - Leitura/escrita de `assets/authorizedGroups.json`
- `src/utils/dynamicCommand.ts` - Onde a lista é checada antes de qualquer comando rodar
- `tests/commands/member/grupos.test.ts`, `tests/utils/authorizedGroups.test.ts` - Testes

## Recursos Técnicos

- ✅ Lista persistida em `assets/authorizedGroups.json` (gitignored, como os outros arquivos de `assets/`)
- ✅ Arquivo ausente ou inválido é tratado como lista vazia (fecha por padrão: nenhum grupo autorizado)
- ✅ Gate aplicado só em grupos; conversas privadas nunca são bloqueadas
- ✅ Operador identificado comparando só os dígitos do número (`onlyNumbers`), então funciona com o JID de telefone; não reconhece o operador se ele mandar pelo LID
