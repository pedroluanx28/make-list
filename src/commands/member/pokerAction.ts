import { PokerAction } from "../../utils/pokerManager";
import { runPokerAction } from "./poker";

const ACTIONS: PokerAction[] = ["check", "call", "raise", "fold", "allin"];

export const pokerAction: Command = {
    name: "Ação de poker",
    description: "Executa a sua ação (check, call, raise, fold ou allin) na sua vez em uma mesa de poker",
    commands: ACTIONS,
    usage: [
        ".check | .call | .fold | .allin",
        ".raise [valor] — sem valor, dobra a aposta atual",
    ].join("\n"),
    handle: async (params) => {
        await runPokerAction(params, params.commandName as PokerAction, params.args);
    },
};
