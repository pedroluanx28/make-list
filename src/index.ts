import { connect } from "./connection";
import { load } from "./loader";

async function start() {
    const socket = await connect();

    load(socket);
}

start();