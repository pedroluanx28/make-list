import { connect } from "./connection";
import { listenToMessages } from "./loader";
import { initializeReminders } from "./utils/reminderManager";

async function start() {
    const socket = await connect(listenToMessages);

    // Once only: reconnecting must not schedule the reminders again
    initializeReminders(socket);
}

start();