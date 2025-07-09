class InvalidParameterError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidParameterError";
    }
}

export { InvalidParameterError };
