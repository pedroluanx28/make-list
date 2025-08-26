import { PREFIX } from "../../config";
import { reminderUtils } from "../../utils/reminderManager";

export const deleteReminder: Command = {
    name: "Deletar Lembrete",
    description: "Deletar um lembrete específico",
    commands: ["deletarlembrete", "deletereminder", "removerlembrete"],
    usage: `${PREFIX}deletarlembrete <id>`,
    handle: async ({ sendReply, fullArgs, userJid }) => {
        const reminderId = fullArgs.trim();

        if (!reminderId) {
            await sendReply(
                `❌ Uso incorreto!\n\n` +
                `📝 Como usar: ${PREFIX}deletarlembrete <id>\n\n` +
                `💡 Use ${PREFIX}lembretes para ver seus lembretes e seus IDs`
            );
            return;
        }

        const reminders = reminderUtils.loadReminders();
        const reminderIndex = reminders.findIndex(r => r.id === reminderId && r.userId === userJid);

        if (reminderIndex === -1) {
            await sendReply(
                `❌ Lembrete não encontrado!\n\n` +
                `🔍 Verifique se o ID está correto usando ${PREFIX}lembretes`
            );
            return;
        }

        const deletedReminder = reminders[reminderIndex];
        reminders.splice(reminderIndex, 1);
        reminderUtils.saveReminders(reminders);

        await sendReply(
            `✅ Lembrete deletado com sucesso!\n\n` +
            `🆔 ID: ${reminderId}\n` +
            `💬 Mensagem: ${deletedReminder.message}`
        );
    },
};
