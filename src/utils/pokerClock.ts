// Time to act, and the same for each time bank extension
export const TURN_TIME_MS = 30000;
export const WARNING_BEFORE_MS = 10000;

type ClockHandlers = {
    onWarning: () => void | Promise<void>;
    onExpire: () => void | Promise<void>;
};

const clocks = new Map<string, ReturnType<typeof setTimeout>[]>();

// An error thrown inside a timer would be an unhandled rejection and stop the whole bot
const safely = (handler: () => void | Promise<void>) => () => {
    Promise.resolve()
        .then(handler)
        .catch((error) => console.error("Erro no relógio do poker:", error));
};

export const stopClock = (chatId: string) => {
    (clocks.get(chatId) ?? []).forEach(clearTimeout);
    clocks.delete(chatId);
};

// One clock per group: starting it again (a new turn or an extension) cancels the previous one
export const startClock = (chatId: string, { onWarning, onExpire }: ClockHandlers) => {
    stopClock(chatId);

    clocks.set(chatId, [
        setTimeout(safely(onWarning), TURN_TIME_MS - WARNING_BEFORE_MS),
        setTimeout(() => {
            clocks.delete(chatId);
            safely(onExpire)();
        }, TURN_TIME_MS),
    ]);
};

export const hasClock = (chatId: string) => clocks.has(chatId);
