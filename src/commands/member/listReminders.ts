import { PREFIX } from "../../config";
import { reminderUtils } from "../../utils/reminderManager";

export const listReminders: Command = {
    name: "Listar Lembretes",
    description: "Listar seus lembretes ativos",
    commands: ["lembretes", "reminders", "listarlembretes"],
    usage: `${PREFIX}lembretes`,
    handle: async ({ sendReply, userJid }) => {
        const reminders = reminderUtils.loadReminders().filter(r => r.userId === userJid);

        if (reminders.length === 0) {
            await sendReply("📝 Você não tem lembretes ativos.");
            return;
        }

        let message = "⏰ *Seus Lembretes:*\n\n";

        reminders.forEach((reminder, index) => {
            const remainingTime = reminder.scheduledTime - Date.now();
            const minutes = Math.floor(remainingTime / (60 * 1000));
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            let timeStr = "";
            if (days > 0) timeStr = `${days}d ${hours % 24}h`;
            else if (hours > 0) timeStr = `${hours}h ${minutes % 60}min`;
            else timeStr = `${minutes}min`;

            message += `${index + 1}. 🆔 ${reminder.id}\n`;
            message += `   ⏰ Em: ${timeStr}\n`;
            message += `   💬 ${reminder.message}\n\n`;
        });

        await sendReply(message);
    },
};
