const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const path = require("path");
const pino = require("pino");
const { question, onlyNumbers } = require("./utils");
const { TEMP_DIR } = require("./config");

exports.connect = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(
        path.resolve(__dirname, "../", "assets", "auth", "baileys")
    );

    const { version } = await fetchLatestBaileysVersion();

    const logger = pino(
        { timestamp: () => `,"time":"${new Date().toJSON()}"` },
        pino.destination(path.join(TEMP_DIR, "wa-logs.txt"))
    );

    const socket = makeWASocket({
        printQRInTerminal: false,
        version,
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        markOnlineOnConnect: true
    });

    if (!socket.authState.creds.registered) {
        const phoneNumber = await question("Informe seu número de telefone para conexão: ")

        if (!phoneNumber) {
            throw new Error("Telefone inválido");
        }

        const code = await socket.requestPairingCode(onlyNumbers(phoneNumber));

        console.log(`Código: ${code}`)
    }

    socket.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                this.connect()
            }
        }
    });

    socket.ev.on("creds.update", saveCreds);

    return socket;
}