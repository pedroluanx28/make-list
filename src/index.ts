import { connect } from "./connection";
import { listenToMessages } from "./loader";
import { initializeReminders } from "./utils/reminderManager";
import { resumePokerClocks } from "./commands/member/poker";

async function start() {
    const socket = await connect(listenToMessages);

    // Once only: reconnecting must not schedule the reminders again
    initializeReminders(socket);
    resumePokerClocks();
}

start();