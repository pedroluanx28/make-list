import makeWASocket, {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import path from "path";
import pino from "pino";
import { question, onlyNumbers } from "./utils"
import { TEMP_DIR } from "./config";
import { Boom } from '@hapi/boom';

export const connect = async (onSocket: (socket) => void = () => {}) => {
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
        markOnlineOnConnect: true,
        shouldIgnoreJid: (jid) => {
            // Some receipts arrive without a JID
            if (!jid) return false;
            if (jid.includes('status@broadcast')) return true;
            if (jid.includes('@g.us') && jid.includes('announce')) return true;
            return false;
        },
        syncFullHistory: false
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
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                connect(onSocket)
            }
        }
    });

    socket.ev.on("creds.update", saveCreds);

    onSocket(socket);

    return socket;
}