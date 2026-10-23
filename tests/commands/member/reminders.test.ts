// In-memory filesystem so reminders.json is never written to disk
const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
    existsSync: (path: string) => mockFiles.has(path),
    readFileSync: (path: string) => mockFiles.get(path),
    writeFileSync: (path: string, data: string) => mockFiles.set(path, data),
    mkdirSync: jest.fn(),
}));

import { reminder } from '../../../src/commands/member/reminder';
import { listReminders } from '../../../src/commands/member/listReminders';
import { deleteReminder } from '../../../src/commands/member/deleteReminder';
import { reminderUtils } from '../../../src/utils/reminderManager';
import { createMockCommonFunctions } from '../../mocks/commonFunctions';

const NOW = new Date('2026-01-01T12:00:00Z').getTime();
const MINUTE = 60 * 1000;
const OTHER_USER = 'other@s.whatsapp.net';

const createReminder = (id: string, minutesFromNow: number, userId = 'user@s.whatsapp.net') => ({
    id,
    userId,
    chatId: 'test@g.us',
    message: `mensagem ${id}`,
    scheduledTime: NOW + minutesFromNow * MINUTE,
    createdAt: NOW,
});

const lastReply = (mock: ReturnType<typeof createMockCommonFunctions>) =>
    mock.sendReply.mock.calls[mock.sendReply.mock.calls.length - 1][0];

beforeEach(() => {
    mockFiles.clear();
    jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
});

describe('reminder command', () => {
    it('should have correct command metadata', () => {
        expect(reminder.name).toBe('Lembrete');
        expect(reminder.commands).toEqual(['lembrete', 'reminder', 'lembrar']);
        expect(reminder.usage).toContain('/lembrete <tempo> <mensagem>');
    });

    it.each(['', '30min', '   '])('should show usage when arguments are missing (%p)', async (fullArgs) => {
        const mock = createMockCommonFunctions({ fullArgs });

        await reminder.handle(mock);

        expect(lastReply(mock)).toContain('Uso incorreto');
        expect(reminderUtils.loadReminders()).toEqual([]);
    });

    it.each(['30', '30m', '2 h', 'amanha', '1y'])('should reject an invalid time format (%p)', async (time) => {
        const mock = createMockCommonFunctions({ fullArgs: `${time} Reunião` });

        await reminder.handle(mock);

        expect(lastReply(mock)).toContain('Formato de tempo inválido');
        expect(reminderUtils.loadReminders()).toEqual([]);
    });

    it.each([
        ['30min', 30 * MINUTE],
        ['2h', 2 * 60 * MINUTE],
        ['1d', 24 * 60 * MINUTE],
        ['1w', 7 * 24 * 60 * MINUTE],
    ])('should save a reminder for %s', async (time, delay) => {
        const mock = createMockCommonFunctions({ fullArgs: `${time} Reunião importante` });

        await reminder.handle(mock);

        expect(reminderUtils.loadReminders()).toEqual([{
            id: NOW.toString(),
            userId: 'user@s.whatsapp.net',
            chatId: 'test@g.us',
            message: 'Reunião importante',
            scheduledTime: NOW + delay,
            createdAt: NOW,
        }]);
        expect(lastReply(mock)).toContain('Lembrete criado com sucesso');
        expect(lastReply(mock)).toContain(`⏰ Tempo: ${time}`);
        expect(lastReply(mock)).toContain(`🆔 ID: ${NOW}`);
    });

    it('should send the reminder when due and remove it from storage', async () => {
        const mock = createMockCommonFunctions({ fullArgs: '30min Reunião importante' });

        await reminder.handle(mock);
        await jest.advanceTimersByTimeAsync(30 * MINUTE - 1);
        expect(mock.sendReply).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(1);
        expect(lastReply(mock)).toBe('⏰ *LEMBRETE:* Reunião importante');
        expect(reminderUtils.loadReminders()).toEqual([]);
    });

    it('should log and keep the reminder when sending fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mock = createMockCommonFunctions({ fullArgs: '1min Teste' });

        await reminder.handle(mock);
        mock.sendReply.mockRejectedValueOnce(new Error('offline'));
        await jest.advanceTimersByTimeAsync(MINUTE);

        expect(errorSpy).toHaveBeenCalledWith('Erro ao enviar lembrete:', expect.any(Error));
        expect(reminderUtils.loadReminders()).toHaveLength(1);
        errorSpy.mockRestore();
    });
});

describe('listReminders command', () => {
    it('should have correct command metadata', () => {
        expect(listReminders.name).toBe('Listar Lembretes');
        expect(listReminders.commands).toEqual(['lembretes', 'reminders', 'listarlembretes']);
        expect(listReminders.usage).toBe('/lembretes');
    });

    it('should tell the user when there are no reminders', async () => {
        const mock = createMockCommonFunctions();

        await listReminders.handle(mock);

        expect(mock.sendReply).toHaveBeenCalledWith('📝 Você não tem lembretes ativos.');
    });

    it("should ignore other users' reminders", async () => {
        reminderUtils.saveReminders([createReminder('1', 30, OTHER_USER)]);
        const mock = createMockCommonFunctions();

        await listReminders.handle(mock);

        expect(mock.sendReply).toHaveBeenCalledWith('📝 Você não tem lembretes ativos.');
    });

    it('should list reminders with the remaining time in minutes, hours or days', async () => {
        reminderUtils.saveReminders([
            createReminder('1', 30),
            createReminder('2', 2 * 60 + 15),
            createReminder('3', 3 * 24 * 60 + 5 * 60),
            createReminder('4', 10, OTHER_USER),
        ]);
        const mock = createMockCommonFunctions();

        await listReminders.handle(mock);

        const reply = lastReply(mock);
        expect(reply).toContain('*Seus Lembretes:*');
        expect(reply).toContain('1. 🆔 1\n   ⏰ Em: 30min\n   💬 mensagem 1');
        expect(reply).toContain('2. 🆔 2\n   ⏰ Em: 2h 15min\n   💬 mensagem 2');
        expect(reply).toContain('3. 🆔 3\n   ⏰ Em: 3d 5h\n   💬 mensagem 3');
        expect(reply).not.toContain('mensagem 4');
    });
});

describe('deleteReminder command', () => {
    it('should have correct command metadata', () => {
        expect(deleteReminder.name).toBe('Deletar Lembrete');
        expect(deleteReminder.commands).toEqual(['deletarlembrete', 'deletereminder', 'removerlembrete']);
        expect(deleteReminder.usage).toBe('/deletarlembrete <id>');
    });

    it('should show usage when the id is missing', async () => {
        const mock = createMockCommonFunctions({ fullArgs: '  ' });

        await deleteReminder.handle(mock);

        expect(lastReply(mock)).toContain('Uso incorreto');
    });

    it('should report when the reminder does not exist', async () => {
        reminderUtils.saveReminders([createReminder('1', 30)]);
        const mock = createMockCommonFunctions({ fullArgs: '999' });

        await deleteReminder.handle(mock);

        expect(lastReply(mock)).toContain('Lembrete não encontrado');
        expect(reminderUtils.loadReminders()).toHaveLength(1);
    });

    it("should not delete another user's reminder", async () => {
        reminderUtils.saveReminders([createReminder('1', 30, OTHER_USER)]);
        const mock = createMockCommonFunctions({ fullArgs: '1' });

        await deleteReminder.handle(mock);

        expect(lastReply(mock)).toContain('Lembrete não encontrado');
        expect(reminderUtils.loadReminders()).toHaveLength(1);
    });

    it('should delete only the matching reminder', async () => {
        reminderUtils.saveReminders([createReminder('1', 30), createReminder('2', 60)]);
        const mock = createMockCommonFunctions({ fullArgs: ' 1 ' });

        await deleteReminder.handle(mock);

        expect(lastReply(mock)).toContain('Lembrete deletado com sucesso');
        expect(lastReply(mock)).toContain('💬 Mensagem: mensagem 1');
        expect(reminderUtils.loadReminders().map(r => r.id)).toEqual(['2']);
    });
});
