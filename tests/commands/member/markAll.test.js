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
const markAll_1 = require("../../../src/commands/member/markAll");
const commonFunctions_1 = require("../../mocks/commonFunctions");
describe('markAll command', () => {
    it('should have correct command metadata', () => {
        expect(markAll_1.markAll.name).toBe('markAll');
        expect(markAll_1.markAll.description).toBe('Marca todos os membros de um grupo');
        expect(markAll_1.markAll.commands).toEqual(['markall', 'all', 'todes']);
        expect(markAll_1.markAll.usage).toBe('/markall');
    });
    it('should send error when no participants found', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)();
        mockFunctions.getGroupParticipants.mockResolvedValue([]);
        yield markAll_1.markAll.handle(mockFunctions);
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('Não consegui obter os membros do grupo.');
    }));
    it('should mention all participants and check group at the end', () => __awaiter(void 0, void 0, void 0, function* () {
        const participants = (0, commonFunctions_1.createMockParticipants)(3);
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({ isGroup: false });
        mockFunctions.getGroupParticipants.mockResolvedValue(participants);
        yield markAll_1.markAll.handle(mockFunctions);
        // Should first send the reaction and mention message
        expect(mockFunctions.sendReact).toHaveBeenCalledWith('');
        expect(mockFunctions.sendReply).toHaveBeenCalledWith(expect.stringContaining('📢 *ATENÇÃO*'), ['user1@s.whatsapp.net', 'user2@s.whatsapp.net', 'user3@s.whatsapp.net']);
        // Then check if it's a group and send error message
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('Este comando só pode ser usado em grupos.');
    }));
    it('should work properly when in group', () => __awaiter(void 0, void 0, void 0, function* () {
        const participants = (0, commonFunctions_1.createMockParticipants)(3);
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({ isGroup: true });
        mockFunctions.getGroupParticipants.mockResolvedValue(participants);
        yield markAll_1.markAll.handle(mockFunctions);
        expect(mockFunctions.sendReact).toHaveBeenCalledWith('');
        expect(mockFunctions.sendReply).toHaveBeenCalledWith(expect.stringContaining('📢 *ATENÇÃO*'), ['user1@s.whatsapp.net', 'user2@s.whatsapp.net', 'user3@s.whatsapp.net']);
        // Should not send the group error message
        expect(mockFunctions.sendReply).not.toHaveBeenCalledWith('Este comando só pode ser usado em grupos.');
    }));
    it('should send additional text when fullArgs provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const participants = (0, commonFunctions_1.createMockParticipants)(2);
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            isGroup: true,
            fullArgs: 'Reunião importante!'
        });
        mockFunctions.getGroupParticipants.mockResolvedValue(participants);
        yield markAll_1.markAll.handle(mockFunctions);
        expect(mockFunctions.sendText).toHaveBeenCalledWith('Reunião importante!');
    }));
});
//# sourceMappingURL=markAll.test.js.map