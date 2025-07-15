type Command = {
    name: string,
    description?: string,
    commands: string[],
    usage: string,
    handle: (params: CommonFunctions) => Promise<void>;
}