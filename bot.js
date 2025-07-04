const {
    default: makeWASocket,
    useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const fs = require("fs");

// Guardar as listas temporárias por usuário
let listaTemporaria = {};

// Embaralhar array (algoritmo Fisher-Yates)
function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({
        auth: state,
    });

    function getArguments(msg) {
        const args = {};
        const regex = /--(\w+)=((?:.|\n)*?)(?=\s--\w+=|$)/g;
        let match;

        while ((match = regex.exec(msg)) !== null) {
            const chave = match[1];
            const valor = match[2].trim();
            args[chave] = valor;
        }

        return args;
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            const qrcode = require("qrcode-terminal");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== 401;
            console.log("Conexão encerrada. Reconectar?", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        }

        if (connection === "open") {
            console.log("✅ Bot conectado com sucesso ao WhatsApp!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const messageText =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ''

        // identificar de qual grupo veio a mensagem
        const groupId = msg.key.remoteJid

        // Detectar lista de nomes com "-"
        if (groupId == "120363022267639068@g.us") {
            if (messageText.startsWith('-')) {
                const nomes = messageText
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l.startsWith('-'))
                    .map(l => l.replace('-', '').trim())

                listaTemporaria[sender] = nomes;

                await sock.sendMessage(sender, {
                    text: `✅ Lista recebida com ${nomes.length} nome(s). Digite "/make-list" para gerar os times.`,
                });
            }
        }

        // Gera os times quando receber "make list"
        if (messageText.toLowerCase() === "/make-list") {
            const nomes = listaTemporaria[sender] || [];

            if (nomes.length === 0) {
                await sock.sendMessage(sender, {
                    text: "⚠️ Nenhuma lista foi recebida ainda.",
                });
                return;
            }

            const embaralhados = embaralhar([...nomes]);
            const times = [];
            const TAMANHO_TIME = 6;

            // Monta os times de 6
            while (embaralhados.length >= TAMANHO_TIME) {
                times.push(embaralhados.splice(0, TAMANHO_TIME));
            }

            // Se sobrar alguém, cria um time extra
            if (embaralhados.length > 0) {
                times.push(embaralhados);
            }

            let resposta = "";
            times.forEach((time, i) => {
                resposta += `*Time ${i + 1}:*\n${time
                    .map((n) => `- ${n}`)
                    .join("\n")}\n\n`;
            });

            await sock.sendMessage(sender, { text: resposta.trim() });

            // Limpa a lista desse contato
            delete listaTemporaria[sender];
        }

        if (messageText.toLowerCase().includes("/template-list")) {
            const arguments = getArguments(messageText);

            if (messageText.toLowerCase().includes("--help")) {
                const helpText = `
                    *Aqui está os parâmetros que você precisa para fazer um template de lista:*
--title=_Título do racha_
--local=_Local do racha_
--time=_Horário do racha_
--price=_Preço do racha por pessoa_
                `;

                await sock.sendMessage(sender, { text: helpText.trim() });

                return;
            }

            const title = arguments.title || "_Título do racha_";
            const time = arguments.time || "_Horário do racha_";
            const local = arguments.local || "_Local do racha_";
            const price = arguments.price || "_Preço do racha por pessoa_";

            const text = `
                *${title}*\n
🏟 ${local}
⏰ Horário ${time} hrs
💵 Cotação: ${price}

            `;

            await sock.sendMessage(sender, { text: text.trim() });
        }
    });
}

startBot();
