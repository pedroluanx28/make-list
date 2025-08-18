import fs from "fs";
import path from "path";

type Reminder = {
    id: string;
    userId: string;
    chatId: string;
    message: string;
    scheduledTime: number;
    createdAt: number;
};

const REMINDERS_FILE = path.join(__dirname, "../../assets/reminders.json");

// Função para carregar lembretes do arquivo
const loadReminders = (): Reminder[] => {
    try {
        if (fs.existsSync(REMINDERS_FILE)) {
            const data = fs.readFileSync(REMINDERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao carregar lembretes:', error);
    }
    return [];
};

// Função para salvar lembretes no arquivo
const saveReminders = (reminders: Reminder[]) => {
    try {
        // Garantir que o diretório existe
        const dir = path.dirname(REMINDERS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
    } catch (error) {
        console.error('Erro ao salvar lembretes:', error);
    }
};

// Função para enviar lembrete
const sendReminder = async (socket: any, reminder: Reminder) => {
    try {
        await socket.sendMessage(reminder.chatId, {
            text: `🤖 ⏰ *LEMBRETE:* ${reminder.message}`
        });

        // Remover lembrete executado
        const reminders = loadReminders().filter(r => r.id !== reminder.id);
        saveReminders(reminders);

        console.log(`Lembrete enviado: ${reminder.message}`);
    } catch (error) {
        console.error('Erro ao enviar lembrete:', error);
    }
};

// Função para inicializar lembretes pendentes
export const initializeReminders = (socket: any) => {
    const reminders = loadReminders();
    const now = Date.now();

    reminders.forEach(reminder => {
        const timeUntilReminder = reminder.scheduledTime - now;

        if (timeUntilReminder <= 0) {
            // Lembrete já deveria ter sido enviado, enviar imediatamente
            sendReminder(socket, reminder);
        } else {
            // Agendar lembrete para o futuro
            setTimeout(() => {
                sendReminder(socket, reminder);
            }, timeUntilReminder);

            console.log(`Lembrete agendado: ${reminder.message} em ${Math.floor(timeUntilReminder / 1000)}s`);
        }
    });

    console.log(`Inicializados ${reminders.length} lembretes`);
};

// Funções utilitárias para os comandos
export const reminderUtils = {
    loadReminders,
    saveReminders
};
