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
const ping_1 = require("../../../src/commands/member/ping");
const commonFunctions_1 = require("../../mocks/commonFunctions");
describe('ping command', () => {
    it('should have correct command metadata', () => {
        expect(ping_1.ping.name).toBe('ping');
        expect(ping_1.ping.description).toBe('Verificar conexão com o bot');
        expect(ping_1.ping.commands).toEqual(['ping']);
        expect(ping_1.ping.usage).toBe('/ping');
    });
    it('should send react and reply when executed', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFunctions = (0, commonFunctions_1.createMockCommonFunctions)();
        yield ping_1.ping.handle(mockFunctions);
        expect(mockFunctions.sendReact).toHaveBeenCalledWith('🏓');
        expect(mockFunctions.sendReply).toHaveBeenCalledWith('Pong! 🏓');
        expect(mockFunctions.sendReact).toHaveBeenCalledTimes(1);
        expect(mockFunctions.sendReply).toHaveBeenCalledTimes(1);
    }));
});
//# sourceMappingURL=ping.test.js.map