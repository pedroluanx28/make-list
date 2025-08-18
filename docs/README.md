# Documentação dos Comandos 📚🤖

Este é o índice geral da documentação de todos os comandos disponíveis no bot Make List. Cada comando possui sua própria documentação detalhada com exemplos, aliases, formatos e recursos técnicos.

## Comandos Disponíveis

### 🎲 [Sortear Times](./drawTeams.md)
**Comando:** `drawteams`  
**Descrição:** Sorteia times de forma equilibrada a partir de uma lista de participantes, com suporte a jogadores sementes (capitães).

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

## Contribuindo

Para adicionar documentação de novos comandos:

1. Crie um novo arquivo `.md` na pasta `docs/`
2. Siga a estrutura padrão apresentada nos exemplos existentes
3. Adicione uma entrada neste arquivo índice
4. Mantenha a documentação atualizada conforme o comando evolui

---

*Documentação gerada para o bot Make List - Sistema de comandos para WhatsApp*