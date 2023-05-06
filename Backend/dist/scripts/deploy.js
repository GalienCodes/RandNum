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
const config_1 = require("./config");
const utils_1 = require("./utils");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let txn;
        let txId;
        // compile PyTeal smart contracts
        const approval = yield (0, utils_1.compileTeal)((0, utils_1.compilePyTeal)("contracts/lotto"));
        const clear = yield (0, utils_1.compileTeal)((0, utils_1.compilePyTeal)("contracts/clear_program"));
        // declare application state storage (immutable)
        let localInts = 2;
        let localBytes = 0;
        let globalInts = 13;
        let globalBytes = 1;
        // get transaction params
        const params = yield utils_1.algodClient.getTransactionParams().do();
        params.fee = 1000;
        params.flatFee = true;
        // create unsigned transaction
        txn = (0, algosdk_1.makeApplicationCreateTxn)(config_1.user.addr, params, algosdk_1.OnApplicationComplete.NoOpOC, approval, clear, localInts, localBytes, globalInts, globalBytes, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 3);
        txId = yield (0, utils_1.submitTransaction)(txn, config_1.user.sk);
        let transactionResponse = yield utils_1.algodClient
            .pendingTransactionInformation(txId)
            .do();
        const appId = transactionResponse["application-index"];
        console.log("Deposit application id: " + appId);
    });
}
main().catch(console.error);
