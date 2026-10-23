import fs from "fs";
import path from "path";
import { DangerError, InvalidParameterError, WarningError } from "../errors";
import { PREFIX } from "../config";

export type MenuItem = {
    name: string;
    price: number; // in cents (e.g. 700 = R$ 7,00)
};

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
    { name: "cuscuz", price: 700 },
    { name: "pão de carne", price: 600 },
    { name: "pão de frango", price: 600 },
    { name: "pão de queijo", price: 600 },
    { name: "pão misto", price: 600 },
    { name: "salada P", price: 500 },
    { name: "salada G", price: 1000 },
    { name: "pizza", price: 600 },
];

// WhatsApp polls accept between 2 and 12 options
export const MIN_MENU_ITEMS = 2;
export const MAX_MENU_ITEMS = 12;
const MAX_NAME_LENGTH = 100;

const MENU_FILE = path.join(__dirname, "../../assets/menu.json");

const isValidMenu = (items: unknown): items is MenuItem[] =>
    Array.isArray(items) &&
    items.length >= MIN_MENU_ITEMS &&
    items.length <= MAX_MENU_ITEMS &&
    items.every(
        (item) =>
            typeof item?.name === "string" &&
            item.name.trim() !== "" &&
            Number.isInteger(item.price) &&
            item.price > 0
    ) &&
    new Set(items.map((item) => item.name.toLocaleLowerCase())).size === items.length;

export const getMenuItems = (): MenuItem[] => {
    if (!fs.existsSync(MENU_FILE)) {
        return DEFAULT_MENU_ITEMS.map((item) => ({ ...item }));
    }

    // Never fall back to the defaults here: the next save would overwrite the custom menu
    let items: unknown;
    try {
        items = JSON.parse(fs.readFileSync(MENU_FILE, "utf8"));
    } catch (error) {
        console.error("Erro ao carregar cardápio:", error);
    }

    if (!isValidMenu(items)) {
        throw new DangerError(
            `O arquivo assets/menu.json está inválido. Corrija-o ou apague-o para voltar ao cardápio padrão.`
        );
    }

    return items;
};

const saveMenuItems = (items: MenuItem[]) => {
    const dir = path.dirname(MENU_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(MENU_FILE, JSON.stringify(items, null, 2));
};

export const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

const getItemIndex = (items: MenuItem[], position: number) => {
    if (!Number.isInteger(position) || position < 1 || position > items.length) {
        throw new InvalidParameterError(
            `o item ${position} não existe. Use ${PREFIX}cardapio para ver a lista.`
        );
    }

    return position - 1;
};

const validateName = (items: MenuItem[], name: string, ignoreIndex = -1) => {
    if (!name) {
        throw new InvalidParameterError("o nome do item não pode ser vazio.");
    }

    if (name.length > MAX_NAME_LENGTH) {
        throw new InvalidParameterError(`o nome do item deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`);
    }

    // Votes are matched by the option name, so names must be unique
    const duplicate = items.some(
        (item, index) => index !== ignoreIndex && item.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (duplicate) {
        throw new WarningError(`Já existe um item chamado "${name}" no cardápio.`);
    }
};

const validatePrice = (price: number) => {
    if (!Number.isInteger(price) || price <= 0) {
        throw new InvalidParameterError("o preço deve ser maior que zero.");
    }
};

export const addMenuItem = (name: string, price: number): MenuItem[] => {
    const items = getMenuItems();

    if (items.length >= MAX_MENU_ITEMS) {
        throw new WarningError(`O cardápio já tem o máximo de ${MAX_MENU_ITEMS} itens permitidos em uma enquete.`);
    }

    validateName(items, name);
    validatePrice(price);

    items.push({ name, price });
    saveMenuItems(items);

    return items;
};

export const updateMenuItem = (
    position: number,
    changes: { name?: string; price?: number }
): MenuItem[] => {
    const items = getMenuItems();
    const index = getItemIndex(items, position);

    if (changes.name !== undefined) validateName(items, changes.name, index);
    if (changes.price !== undefined) validatePrice(changes.price);

    items[index] = { ...items[index], ...changes };
    saveMenuItems(items);

    return items;
};

export const removeMenuItem = (position: number): { removed: MenuItem; items: MenuItem[] } => {
    const items = getMenuItems();
    const index = getItemIndex(items, position);

    if (items.length <= MIN_MENU_ITEMS) {
        throw new WarningError(`O cardápio precisa ter pelo menos ${MIN_MENU_ITEMS} itens para a enquete.`);
    }

    const [removed] = items.splice(index, 1);
    saveMenuItems(items);

    return { removed, items };
};
