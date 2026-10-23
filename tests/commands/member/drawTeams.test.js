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
const drawTeams_1 = require("../../../src/commands/member/drawTeams");
const commonFunctions_1 = require("../../mocks/commonFunctions");
describe('drawTeams command', () => {
    it('should have correct command metadata', () => {
        expect(drawTeams_1.drawTeams.name).toBe('Sortear times');
        expect(drawTeams_1.drawTeams.description).toBe('Sortear times a partir de uma lista');
        expect(drawTeams_1.drawTeams.commands).toEqual(['drawteams']);
        expect(drawTeams_1.drawTeams.usage).toBe('/draw-teams');
    });
    it('should reply with error when no list is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            fullMessage: '/drawteams'
        });
        yield drawTeams_1.drawTeams.handle(mockFunctions);
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('Nenhuma lista foi enviada');
    }));
    it('should reply with error when no valid list items found', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            fullMessage: '/drawteams\nSome text without dashes\nMore text'
        });
        yield drawTeams_1.drawTeams.handle(mockFunctions);
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('Nenhuma lista foi enviada');
    }));
    it('should create teams from list of players', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            fullMessage: '/drawteams\n- João\n- Maria\n- Pedro\n- Ana\n- Carlos\n- Lucia'
        });
        yield drawTeams_1.drawTeams.handle(mockFunctions);
        const replyCall = mockFunctions.sendReply.mock.calls[0][0];
        expect(replyCall).toMatch(/\*Time \d+:\*/);
        expect(replyCall).toContain('-João');
        expect(replyCall).toContain('-Maria');
        expect(replyCall).toContain('-Pedro');
        expect(replyCall).toContain('-Ana');
        expect(replyCall).toContain('-Carlos');
        expect(replyCall).toContain('-Lucia');
    }));
    it('should handle seeds (players with crown emoji) properly', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({
            fullMessage: '/drawteams\n- João 👑\n- Maria\n- Pedro 👑\n- Ana\n- Carlos\n- Lucia'
        });
        yield drawTeams_1.drawTeams.handle(mockFunctions);
        const replyCall = mockFunctions.sendReply.mock.calls[0][0];
        // Should create teams and distribute seeds across different teams
        expect(replyCall).toMatch(/\*Time \d+:\*/);
        expect(replyCall).toContain('-João 👑');
        expect(replyCall).toContain('-Pedro 👑');
    }));
    it('should create multiple teams when more than 6 players', () => __awaiter(void 0, void 0, void 0, function* () {
        const players = Array.from({ length: 10 }, (_, i) => `- Player${i + 1}`);
        const fullMessage = `/drawteams\n${players.join('\n')}`;
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({ fullMessage });
        yield drawTeams_1.drawTeams.handle(mockFunctions);
        const replyCall = mockFunctions.sendReply.mock.calls[0][0];
        // Should have multiple teams
        expect(replyCall).toMatch(/\*Time 1:\*/);
        expect(replyCall).toMatch(/\*Time 2:\*/);
    }));
    it('should limit teams to maximum 6 players each', () => __awaiter(void 0, void 0, void 0, function* () {
        const players = Array.from({ length: 8 }, (_, i) => `- Player${i + 1}`);
        const fullMessage = `/drawteams\n${players.join('\n')}`;
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)({ fullMessage });
        yield drawTeams_1.drawTeams.handle(mockFunctions);
        const replyCall = mockFunctions.sendReply.mock.calls[0][0];
        // Count how many players are in each team
        const teams = replyCall.split('*Time').slice(1); // Remove first empty element
        teams.forEach(team => {
            const playerCount = (team.match(/-Player/g) || []).length;
            expect(playerCount).toBeLessThanOrEqual(6);
        });
    }));
});
//# sourceMappingURL=drawTeams.test.js.map