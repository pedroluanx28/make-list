import { PREFIX } from "../../config";
import { InvalidParameterError, WarningError } from "../../errors";
import { formatCommand } from "../../utils";
import {
    MenuItem,
    addMenuItem,
    formatPrice,
    getMenuItems,
    removeMenuItem,
    updateMenuItem,
} from "../../utils/menuManager";
import { hasOpenOrder } from "../../utils/pedidoManager";

const USAGE = [
    `${PREFIX}cardapio — lista os itens`,
    `${PREFIX}cardapio adicionar <nome> | <preço>`,
    `${PREFIX}cardapio editar <nº> | <novo nome> | <novo preço>`,
    `${PREFIX}cardapio remover <nº>`,
].join("\n");

const ADD_ACTIONS = ["adicionar", "add"];
const EDIT_ACTIONS = ["editar", "atualizar", "edit"];
const REMOVE_ACTIONS = ["remover", "deletar", "del"];

const formatMenu = (items: MenuItem[]) =>
    `🍽️ *Cardápio do pedido:*\n\n${items
        .map((item, index) => `${index + 1}. ${item.name} — ${formatPrice(item.price)}`)
        .join("\n")}`;

// Accepts "7", "7,5", "7,50", "7.50" and "R$ 7,50"; returns cents
const parsePrice = (text: string) => {
    const normalized = text.replace(/r\$/i, "").replace(/\s/g, "").replace(",", ".");

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
        throw new InvalidParameterError(`preço "${text}" inválido. Exemplo: 7,50`);
    }

    return Math.round(parseFloat(normalized) * 100);
};

const parsePosition = (text: string) => {
    if (!/^\d+$/.test(text)) {
        throw new InvalidParameterError(`informe o número do item. Use ${PREFIX}cardapio para ver a lista.`);
    }

    return parseInt(text, 10);
};

export const cardapio: Command = {
    name: "Cardápio",
    description: "Listar, adicionar, editar ou remover itens do cardápio do pedido",
    commands: ["cardapio", "produtos"],
    usage: USAGE,
    handle: async ({ fullArgs, sendReply, sendSuccessReply }) => {
        const input = (fullArgs || "").trim();
        const spaceIndex = input.search(/\s/);
        const action = formatCommand(spaceIndex === -1 ? input : input.slice(0, spaceIndex));
        const params = (spaceIndex === -1 ? "" : input.slice(spaceIndex + 1))
            .split("|")
            .map((param) => param.trim());

        if (!action) {
            await sendReply(`${formatMenu(getMenuItems())}\n\n${USAGE}`);
            return;
        }

        const isKnownAction = [...ADD_ACTIONS, ...EDIT_ACTIONS, ...REMOVE_ACTIONS].includes(action);
        if (!isKnownAction) {
            throw new InvalidParameterError(`ação "${action}" desconhecida.\n\n${USAGE}`);
        }

        // Votes and totals depend on the menu, so it can't change while an order is open
        if (hasOpenOrder()) {
            throw new WarningError(
                `Não é possível alterar o cardápio com um pedido em aberto. Aguarde o encerramento ou use ${PREFIX}pedido-encerrar no grupo do pedido.`
            );
        }

        if (ADD_ACTIONS.includes(action)) {
            const [name = "", price = ""] = params;
            if (!name || !price) {
                throw new InvalidParameterError(`use ${PREFIX}cardapio adicionar <nome> | <preço>`);
            }

            const priceInCents = parsePrice(price);
            const items = addMenuItem(name, priceInCents);
            await sendSuccessReply(`Item adicionado: ${name} — ${formatPrice(priceInCents)}\n\n${formatMenu(items)}`);
            return;
        }

        if (EDIT_ACTIONS.includes(action)) {
            const [position = "", name = "", price = ""] = params;
            if (!position || (!name && !price)) {
                throw new InvalidParameterError(
                    `use ${PREFIX}cardapio editar <nº> | <novo nome> | <novo preço> (deixe um campo vazio para mantê-lo)`
                );
            }

            const changes: { name?: string; price?: number } = {};
            if (name) changes.name = name;
            if (price) changes.price = parsePrice(price);

            const items = updateMenuItem(parsePosition(position), changes);
            await sendSuccessReply(`Item atualizado!\n\n${formatMenu(items)}`);
            return;
        }

        const [position = ""] = params;
        const { removed, items } = removeMenuItem(parsePosition(position));
        await sendSuccessReply(`Item removido: ${removed.name}\n\n${formatMenu(items)}`);
    },
};
