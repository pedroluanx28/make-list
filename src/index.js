const { connect } = require("./connection");
const { load } = require("./load");

async function start() {
    const socket = await connect();

    load(socket);
}

start();