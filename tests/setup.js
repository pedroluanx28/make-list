// Global test setup
global.console = Object.assign(Object.assign({}, console), { 
    // Suppress console.log during tests unless DEBUG is set
    log: process.env.DEBUG ? console.log : jest.fn(), error: console.error, warn: console.warn, info: console.info, debug: console.debug });
//# sourceMappingURL=setup.js.map