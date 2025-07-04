const {default: makeWASocket, useMultiFileAuthState} = require('@whiskeysockets/baileys')
const fs = require('fs')

// Guardar as listas temporárias por usuário
let listaTemporaria = {}

// Embaralhar array (algoritmo Fisher-Yates)
function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

async function startBot() {
    const {state, saveCreds} = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        auth: state,
    })

    sock.ev.on('connection.update', (update) => {
        const {connection, lastDisconnect, qr} = update

        if (qr) {
            const qrcode = require('qrcode-terminal')
            qrcode.generate(qr, {small: true})
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401
            console.log('Conexão encerrada. Reconectar?', shouldReconnect)
            if (shouldReconnect) {
                startBot()
            }
        }

        if (connection === 'open') {
            console.log('✅ Bot conectado com sucesso ao WhatsApp!')
        }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const sender = msg.key.remoteJid
        const messageText =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ''

        // Detectar lista de nomes com "-"
        if (messageText.startsWith('-')) {
            const nomes = messageText
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('-'))
                .map(l => l.replace('-', '').trim())

            listaTemporaria[sender] = nomes

            await sock.sendMessage(sender, {
                text: `✅ Lista recebida com ${nomes.length} nome(s). Digite "/make-list" para gerar os times.`
            })
        }

        // Gera os times quando receber "make list"
        if (messageText.toLowerCase() === '/make-list') {
            const nomes = listaTemporaria[sender] || []

            if (nomes.length === 0) {
                await sock.sendMessage(sender, {
                    text: '⚠️ Nenhuma lista foi recebida ainda.'
                })
                return
            }

            const embaralhados = embaralhar([...nomes])
            const times = []
            const TAMANHO_TIME = 6

            // Monta os times de 6
            while (embaralhados.length >= TAMANHO_TIME) {
                times.push(embaralhados.splice(0, TAMANHO_TIME))
            }

            // Se sobrar alguém, cria um time extra
            if (embaralhados.length > 0) {
                times.push(embaralhados)
            }

            let resposta = ''
            times.forEach((time, i) => {
                resposta += `*Time ${i + 1}:*\n${time.map(n => `- ${n}`).join('\n')}\n\n`
            })

            await sock.sendMessage(sender, {text: resposta.trim()})

            // Limpa a lista desse contato
            delete listaTemporaria[sender]
        }
    })
}

startBot()
