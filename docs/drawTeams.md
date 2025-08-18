# Sortear Times 🎲⚽

O comando `drawteams` permite sortear times de forma equilibrada a partir de uma lista de participantes, com suporte a jogadores sementes (capitães) que são distribuídos primeiro entre os times.

## Descrição do Comando

Sorteia times automaticamente a partir de uma lista de nomes, garantindo distribuição equilibrada. Suporta até 6 jogadores por time e reconhece jogadores sementes marcados com a coroa 👑.

## Exemplos

**Uso básico:**
```
/drawteams
- João
- Maria  
- Pedro
- Ana
- Carlos
- Fernanda
```

**Com jogadores sementes (capitães):**
```
/drawteams
- João 👑
- Maria
- Pedro 👑  
- Ana
- Carlos
- Fernanda
- Lucas
- Beatriz
```

## Aliases

- `drawteams`

## Formatos dos Parâmetros

O comando não recebe parâmetros diretos. Em vez disso, espera uma lista formatada na mensagem:

- **Lista de jogadores**: Cada nome deve estar em uma linha separada, começando com `-`
- **Jogadores sementes**: Adicione 👑 após o nome para marcar como capitão/semente
- **Máximo por time**: 6 jogadores por time
- **Distribuição**: Os times são criados automaticamente baseado no número total de participantes

## Como Funciona

1. **Leitura da lista**: O comando extrai todos os nomes que começam com `-` da mensagem
2. **Identificação de sementes**: Jogadores com 👑 são marcados como sementes (capitães)
3. **Embaralhamento**: Tanto sementes quanto jogadores regulares são embaralhados aleatoriamente
4. **Distribuição de sementes**: Sementes são distribuídas primeiro, uma por time quando possível
5. **Preenchimento dos times**: Jogadores regulares são adicionados aos times de forma circular
6. **Limitação por time**: Máximo de 6 jogadores por time
7. **Resultado**: Retorna os times formatados com numeração

## Arquivos

- `src/commands/member/drawTeams.ts` - Implementação principal do comando
- `src/@types/command.ts` - Definição do tipo Command

## Recursos Técnicos

- ✅ Algoritmo de embaralhamento Fisher-Yates
- ✅ Sistema de sementes (capitães) para distribuição equilibrada
- ✅ Limitação automática de 6 jogadores por time
- ✅ Distribuição circular para equilibrar os times
- ✅ Validação de entrada (requer pelo menos um nome na lista)
- ✅ Formatação clara do resultado com numeração dos times
- ✅ Suporte a qualquer quantidade de jogadores
- ✅ Criação automática do número ideal de times baseado no total de participantes