"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const templateList_1 = require("../../../src/commands/member/templateList");
const commonFunctions_1 = require("../../mocks/commonFunctions");
describe('templateList command', () => {
    it('should have correct command metadata', () => {
        expect(templateList_1.templateList.name).toBe('Template de Lista');
        expect(templateList_1.templateList.description).toBe('Cria um template de lista');
        expect(templateList_1.templateList.commands).toEqual(['racha', 'templatelist']);
        expect(templateList_1.templateList.usage).toBe('/templatelist');
    });
    it('should show help when --help is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            fullArgs: 'some args --help more args'
        });
        yield templateList_1.templateList.handle(mockFunctions);
        expect(mockFunctions.sendReply).toHaveBeenCalledWith(expect.stringContaining('*Aqui estão as variaveis que você pode usar:*'));
        expect(mockFunctions.sendReply).toHaveBeenCalledWith(expect.stringContaining('_local:_ Local do racha'));
    }));
    it('should create template with default values when no args provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({ fullArgs: '' });
        yield templateList_1.templateList.handle(mockFunctions);
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('\n*Racha*\n🏟 Local: Não definido\n💵 Preço: Não definido\n⏰ Horário: Não definido');
    }));
    it('should create template with parsed arguments', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            fullArgs: 'local="Campo do Clube" valor="R$ 20,00" titulo="Pelada da Quinta" horario="19:00"'
        });
        yield templateList_1.templateList.handle(mockFunctions);
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('\n*Pelada da Quinta*\n🏟 Local: Campo do Clube\n💵 Preço: R$ 20,00\n⏰ Horário: 19:00');
    }));
    it('should handle partial arguments', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            fullArgs: 'titulo="Teste" local="Aqui"'
        });
        yield templateList_1.templateList.handle(mockFunctions);
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('\n*Teste*\n🏟 Local: Aqui\n💵 Preço: Não definido\n⏰ Horário: Não definido');
    }));
});
//# sourceMappingURL=templateList.test.js.map