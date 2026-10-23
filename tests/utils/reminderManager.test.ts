// In-memory filesystem so reminders.json is never written to disk
const mockFiles = new Map<string, string>();
jest.mock('fs', () => ({
    existsSync: (path: string) => mockFiles.has(path),
    readFileSync: (path: string) => mockFiles.get(path),
    writeFileSync: jest.fn((path: string, data: string) => mockFiles.set(path, data)),
    mkdirSync: jest.fn((path: string) => mockFiles.set(path, '')),
}));

import fs from 'fs';
import path from 'path';
import { initializeReminders, reminderUtils } from '../../src/utils/reminderManager';

const REMINDERS_FILE = path.join(__dirname, '../../assets/reminders.json');
const NOW = new Date('2026-01-01T12:00:00Z').getTime();

const createReminder = (id: string, scheduledTime: number) => ({
    id,
    userId: 'user@s.whatsapp.net',
    chatId: 'test@g.us',
    message: `mensagem ${id}`,
    scheduledTime,
    createdAt: NOW,
});

describe('reminderManager', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        mockFiles.clear();
        jest.useFakeTimers({ now: NOW });
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        errorSpy.mockRestore();
        jest.clearAllMocks();
    });

    describe('loadReminders', () => {
        it('should return an empty list when the file does not exist', () => {
            expect(reminderUtils.loadReminders()).toEqual([]);
        });

        it('should return the reminders saved in the file', () => {
            const reminders = [createReminder('1', NOW + 1000)];
            mockFiles.set(REMINDERS_FILE, JSON.stringify(reminders));

            expect(reminderUtils.loadReminders()).toEqual(reminders);
        });

        it('should return an empty list and log when the file is corrupted', () => {
            mockFiles.set(REMINDERS_FILE, '{ invalido');

            expect(reminderUtils.loadReminders()).toEqual([]);
            expect(errorSpy).toHaveBeenCalledWith('Erro ao carregar lembretes:', expect.any(SyntaxError));
        });
    });

    describe('saveReminders', () => {
        it('should create the directory and write the reminders', () => {
            const reminders = [createReminder('1', NOW + 1000)];

            reminderUtils.saveReminders(reminders);

            expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(REMINDERS_FILE), { recursive: true });
            expect(JSON.parse(mockFiles.get(REMINDERS_FILE)!)).toEqual(reminders);
        });

        it('should not create the directory when it already exists', () => {
            mockFiles.set(path.dirname(REMINDERS_FILE), '');

            reminderUtils.saveReminders([]);

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should log instead of throwing when writing fails', () => {
            (fs.writeFileSync as jest.Mock).mockImplementationOnce(() => {
                throw new Error('disco cheio');
            });

            expect(() => reminderUtils.saveReminders([])).not.toThrow();
            expect(errorSpy).toHaveBeenCalledWith('Erro ao salvar lembretes:', expect.any(Error));
        });
    });

    describe('initializeReminders', () => {
        const createSocket = () => ({ sendMessage: jest.fn().mockResolvedValue(undefined) });

        it('should send overdue reminders immediately and remove them', async () => {
            const socket = createSocket();
            mockFiles.set(REMINDERS_FILE, JSON.stringify([createReminder('1', NOW - 1000)]));

            initializeReminders(socket);
            await jest.runAllTimersAsync();

            expect(socket.sendMessage).toHaveBeenCalledWith('test@g.us', { text: '🤖 ⏰ *LEMBRETE:* mensagem 1' });
            expect(reminderUtils.loadReminders()).toEqual([]);
        });

        it('should schedule future reminders and only send them when due', async () => {
            const socket = createSocket();
            mockFiles.set(REMINDERS_FILE, JSON.stringify([
                createReminder('1', NOW + 60_000),
                createReminder('2', NOW + 120_000),
            ]));

            initializeReminders(socket);
            await jest.advanceTimersByTimeAsync(59_999);
            expect(socket.sendMessage).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1);
            expect(socket.sendMessage).toHaveBeenCalledTimes(1);
            expect(reminderUtils.loadReminders().map(r => r.id)).toEqual(['2']);

            await jest.advanceTimersByTimeAsync(60_000);
            expect(socket.sendMessage).toHaveBeenCalledTimes(2);
            expect(reminderUtils.loadReminders()).toEqual([]);
        });

        it('should keep the reminder and log when sending fails', async () => {
            const socket = { sendMessage: jest.fn().mockRejectedValue(new Error('offline')) };
            const reminders = [createReminder('1', NOW - 1000)];
            mockFiles.set(REMINDERS_FILE, JSON.stringify(reminders));

            initializeReminders(socket);
            await jest.runAllTimersAsync();

            expect(errorSpy).toHaveBeenCalledWith('Erro ao enviar lembrete:', expect.any(Error));
            expect(reminderUtils.loadReminders()).toEqual(reminders);
        });

        it('should do nothing when there are no reminders', () => {
            const socket = createSocket();

            initializeReminders(socket);

            expect(jest.getTimerCount()).toBe(0);
            expect(socket.sendMessage).not.toHaveBeenCalled();
        });
    });
});
