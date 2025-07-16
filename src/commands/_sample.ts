import { PREFIX } from "../config";

export const sample = {
    name: "command name",
    description: "command description",
    commands: ["alias1", "alias2"],
    usage: `${PREFIX}command`,
    handle: async ({ }) => {
        // Handle the command logic here
    }
}