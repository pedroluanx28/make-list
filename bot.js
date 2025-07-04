const venom = require('venom-bot')

let listaTemporaria = {}

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function getArguments(msg) {
  const args = {}
  const regex = /--(\w+)=((?:.|\n)*?)(?=\s--\w+=|$)/g
  let match

  while ((match = regex.exec(msg)) !== null) {
    const chave = match[1]
    const valor = match[2].trim()
    args[chave] = valor
  }

  return args
}

venom
  .create({
    session: 'auth', // Nome da pasta que vai armazenar os dados de autenticação
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log('❌ Erro ao iniciar o bot:', erro)
  })

function start(client) {
  console.log('✅ Bot iniciado com Venom!')

  client.onMessage(async (message) => {
    const messageText = message.body
    const sender = message.from
    const groupId = message.chatId

    console.log(groupId);

    // ⛔ Ignora mensagens de si mesmo
    if (message.isSentByMe) return

    // ✅ Lista com nomes (- Nome)
    if (
      groupId === '120363022267639068@g.us' &&
      messageText.startsWith('-')
    ) {
      const nomes = messageText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('-'))
        .map((l) => l.replace('-', '').trim())

      listaTemporaria[sender] = nomes

      await client.sendText(
        sender,
        `✅ Lista recebida com ${nomes.length} nome(s).\nDigite "/make-list" para gerar os times.`
      )
    }

    // ✅ Comando para gerar os times
    if (messageText.toLowerCase() === '/make-list') {
      const nomes = listaTemporaria[sender] || []

      if (nomes.length === 0) {
        await client.sendText(sender, '⚠️ Nenhuma lista foi recebida ainda.')
        return
      }

      const embaralhados = embaralhar([...nomes])
      const times = []
      const TAMANHO_TIME = 6

      while (embaralhados.length >= TAMANHO_TIME) {
        times.push(embaralhados.splice(0, TAMANHO_TIME))
      }

      if (embaralhados.length > 0) {
        times.push(embaralhados)
      }

      let resposta = ''
      times.forEach((time, i) => {
        resposta += `*Time ${i + 1}:*\n${time
          .map((n) => `- ${n}`)
          .join('\n')}\n\n`
      })

      await client.sendText(sender, resposta.trim())
      delete listaTemporaria[sender]
    }

    // ✅ Comando de template
    if (messageText.toLowerCase().startsWith('/template-list')) {
      const args = getArguments(messageText)

      if (messageText.toLowerCase().includes('--help')) {
        const helpText = `
*Parâmetros disponíveis:*

--title=_Título do racha_
--local=_Local do racha_
--time=_Horário do racha_
--price=_Preço do racha por pessoa_
        `
        await client.sendText(sender, helpText.trim())
        return
      }

      const title = args.title || '_Título do racha_'
      const time = args.time || '_Horário do racha_'
      const local = args.local || '_Local do racha_'
      const price = args.price || '_Preço do racha por pessoa_'

      const text = `
*${title}*

🏟 ${local}
⏰ Horário ${time} hrs
💵 Cotação: ${price}
      `
      await client.sendText(sender, text.trim())
    }
  })
}
