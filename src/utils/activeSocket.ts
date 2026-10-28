// The socket changes on every reconnection; scheduled work (timers) must send through the current one
let activeSocket: any = null;

export const setActiveSocket = (socket: any) => {
    activeSocket = socket;
};

export const getActiveSocket = () => activeSocket;
