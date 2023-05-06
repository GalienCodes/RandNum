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
const algosdk_1 = require("algosdk");
const config_1 = require("../scripts/config");
const lottoCall_1 = require("../scripts/lottoCall");
const utils_1 = require("../scripts/utils");
const helpers_1 = require("../server/helpers");
//make sure a new test version of the contract is deployed
describe("Lotto", () => {
    jest.setTimeout(10000);
    test("it should initialize game params", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const ticketingStart = Math.round(Date.now() / 1000 + 200);
        const ticketingDuration = 960;
        const withdrawalStart = ticketingStart + 2000;
        const ticketFee = 2e6;
        const winMultiplier = 2;
        const maxPlayersAllowed = 2;
        const maxGuessNumber = 10000;
        const gameMasterAddr = config_1.user.addr;
        const data = yield (0, lottoCall_1.initializeGameParams)(gameMasterAddr, BigInt(ticketingStart), ticketingDuration, ticketFee, winMultiplier, maxGuessNumber, maxPlayersAllowed, config_1.appAddr, BigInt(withdrawalStart));
        expect(data.status).toBe(true);
        const initGameTxns = (_a = data.txns) === null || _a === void 0 ? void 0 : _a.map((txn) => txn.signTxn(config_1.user.sk));
        if (initGameTxns) {
            const { txId } = yield utils_1.algodClient.sendRawTransaction(initGameTxns).do();
            yield (0, algosdk_1.waitForConfirmation)(utils_1.algodClient, txId, 1000);
            expect(txId).toBeInstanceOf(String);
        }
    }));
    test("it should fetch game params", () => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield (0, helpers_1.getCurrentGameParam)();
        expect(data).toBeInstanceOf(Object);
    }));
});
