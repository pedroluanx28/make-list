// Hook PostToolUse: roda o tsc depois de edições em src/ e devolve os erros de tipo ao Claude.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Sobe a partir do arquivo editado até o tsconfig.json, para checar o worktree certo
const findProjectRoot = (filePath) => {
    let dir = path.dirname(filePath);
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, "tsconfig.json"))) return dir;
        dir = path.dirname(dir);
    }
    return process.env.CLAUDE_PROJECT_DIR;
};

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
    const filePath = JSON.parse(input).tool_input?.file_path ?? "";

    if (!/[\\/]src[\\/].*\.ts$/.test(filePath)) return;

    try {
        execSync("npx tsc --noEmit", { cwd: findProjectRoot(filePath), stdio: "pipe" });
    } catch (error) {
        // exit 2 faz o Claude Code mostrar o stderr para o modelo corrigir
        process.stderr.write(`tsc encontrou erros de tipo:\n${error.stdout}`);
        process.exit(2);
    }
});
