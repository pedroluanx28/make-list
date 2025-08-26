import { PREFIX } from "../../config";
import { reminderUtils } from "../../utils/reminderManager";

type Reminder = {
    id: string;
    userId: string;
    chatId: string;
    message: string;
    scheduledTime: number;
    createdAt: number;
};

export const reminder: Command = {
    name: "Lembrete",
    description: "Criar e gerenciar lembretes",
    commands: ["lembrete", "reminder", "lembrar"],
    usage: `${PREFIX}lembrete <tempo> <mensagem>\nExemplo: ${PREFIX}lembrete 30min Reunião importante`,
    handle: async ({ sendReply, fullArgs, userJid, remoteJid }) => {
        const args = fullArgs.trim().split(' ');

        if (args.length < 2) {
            await sendReply(
                `❌ Uso incorreto!\n\n` +
                `📝 Como usar:\n` +
                `${PREFIX}lembrete <tempo> <mensagem>\n\n` +
                `⏰ Formatos de tempo:\n` +
                `• 30min - 30 minutos\n` +
                `• 2h - 2 horas\n` +
                `• 1d - 1 dia\n` +
                `• 1w - 1 semana\n\n` +
                `💡 Exemplo: ${PREFIX}lembrete 30min Reunião importante`
            );
            return;
        }

        const timeStr = args[0];
        const message = args.slice(1).join(' ');

        // Converter tempo para milissegundos
        const timeMultipliers = {
            'min': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000
        };

        const timeMatch = timeStr.match(/^(\d+)(min|h|d|w)$/);
        if (!timeMatch) {
            await sendReply(
                `❌ Formato de tempo inválido!\n\n` +
                `⏰ Formatos aceitos:\n` +
                `• 30min - 30 minutos\n` +
                `• 2h - 2 horas\n` +
                `• 1d - 1 dia\n` +
                `• 1w - 1 semana`
            );
            return;
        }

        const [, amount, unit] = timeMatch;
        const delay = parseInt(amount) * timeMultipliers[unit];
        const scheduledTime = Date.now() + delay;

        const reminder: Reminder = {
            id: Date.now().toString(),
            userId: userJid,
            chatId: remoteJid,
            message,
            scheduledTime,
            createdAt: Date.now()
        };

        // Salvar lembrete
        const reminders = reminderUtils.loadReminders();
        reminders.push(reminder);
        reminderUtils.saveReminders(reminders);

        // Agendar o lembrete
        setTimeout(async () => {
            try {
                await sendReply(`⏰ *LEMBRETE:* ${message}`);

                // Remover lembrete executado
                const updatedReminders = reminderUtils.loadReminders().filter(r => r.id !== reminder.id);
                reminderUtils.saveReminders(updatedReminders);
            } catch (error) {
                console.error('Erro ao enviar lembrete:', error);
            }
        }, delay);

        const timeDisplay = `${amount}${unit}`;
        await sendReply(
            `✅ Lembrete criado com sucesso!\n\n` +
            `⏰ Tempo: ${timeDisplay}\n` +
            `📝 Mensagem: ${message}\n` +
            `🆔 ID: ${reminder.id}`
        );
    },
};
