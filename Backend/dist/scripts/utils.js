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
exports.getAppCallTransactionsFromRound = exports.getAppCallTransactionsBetweenRounds = exports.getAppCallTransactions = exports.getAppGenerateRandomNumberTransactions = exports.getAppPayWinnerTransactionsFromRound = exports.getAppPayWinnerTransactionsBetweenRounds = exports.getAppPayWinnerTransactions = exports.getAppEnterGameTransactionsFromRound = exports.getAppEnterGameTransactionsBetweenRounds = exports.getAppEnterGameTransactions = exports.getAppCreateGameTransactionsFromRound = exports.getAppCreateGameTransactionsBetweenRounds = exports.getAppCreateGameTransactions = exports.getAppPayTransactionsFromRound = exports.getAppPayTransactionsBetweenRounds = exports.getAppPayTransactions = exports.getUserTransactionstoAppBetweenRounds = exports.getUserTransactionstoApp = exports.checkUserOptedIn = exports.getTransactionReference = exports.sendAlgo = exports.encodeTxn = exports.compileTeal = exports.compilePyTeal = exports.submitTransaction = exports.getMethodByName = exports.cache = exports.sleep = exports.algoIndexer = exports.algodClient = void 0;
const algosdk_1 = require("algosdk");
const algosdk_2 = require("algosdk");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const config_1 = require("./config");
// // create client object to connect to sandbox's algod client
// const algodToken =
//   "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
// const algodServer = "http://localhost";
const token = {
    "X-API-Key": config_1.API_KEY,
};
const algodServer = "https://testnet-algorand.api.purestake.io/ps2";
const indexerServer = "https://testnet-algorand.api.purestake.io/idx2";
const algodPort = "";
const indexerPort = "";
exports.algodClient = new algosdk_1.Algodv2(token, algodServer, algodPort);
exports.algoIndexer = new algosdk_2.Indexer(token, indexerServer, indexerPort);
// Read in the local contract.json file
const buff = (0, fs_1.readFileSync)("contracts/contract.json");
// Parse the json file into an object, pass it to create an ABIContract object
const contract = new algosdk_2.ABIContract(JSON.parse(buff.toString()));
function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
exports.sleep = sleep;
function cache(key, callbackInputs, expireIn, callbackFn, client) {
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedResponse = yield client.get(key);
            if (cachedResponse) {
                return JSON.parse(cachedResponse);
            }
            const result = yield callbackFn(...callbackInputs);
            yield client.set(key, JSON.stringify(result), { EX: expireIn * 60 });
            return result;
        });
    }
    return run();
}
exports.cache = cache;
// Utility function to return an ABIMethod by its name
function getMethodByName(name) {
    const m = contract.methods.find((mt) => {
        return mt.name == name;
    });
    if (m === undefined)
        throw Error("Method undefined: " + name);
    return m;
}
exports.getMethodByName = getMethodByName;
function submitTransaction(txn, sk) {
    return __awaiter(this, void 0, void 0, function* () {
        const signedTxn = txn.signTxn(sk);
        const { txId } = yield exports.algodClient.sendRawTransaction(signedTxn).do();
        yield (0, algosdk_1.waitForConfirmation)(exports.algodClient, txId, 1000);
        return txId;
    });
}
exports.submitTransaction = submitTransaction;
function compilePyTeal(path) {
    const pythonProcess = (0, child_process_1.spawnSync)("/Users/jaybee/Desktop/Code/Algorand/Smart-ASA/venv/bin/python3", [`${path}.py`]);
    if (pythonProcess.stderr)
        console.log(pythonProcess.stderr.toString());
    return pythonProcess.stdout.toString();
}
exports.compilePyTeal = compilePyTeal;
function compileTeal(programSource) {
    return __awaiter(this, void 0, void 0, function* () {
        //@ts-ignore
        const enc = new TextEncoder();
        const programBytes = enc.encode(programSource);
        const compileResponse = yield exports.algodClient.compile(programBytes).do();
        return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    });
}
exports.compileTeal = compileTeal;
function encodeTxn(txn) {
    const encoded = (0, algosdk_1.encodeUnsignedTransaction)(txn);
    //@ts-ignore
    return Array.from(encoded);
}
exports.encodeTxn = encodeTxn;
function sendAlgo(senderaccount, receiverAddr, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        let params = yield exports.algodClient.getTransactionParams().do();
        const enc = new TextEncoder();
        const note = enc.encode("Hello");
        let txn = (0, algosdk_1.makePaymentTxnWithSuggestedParamsFromObject)({
            from: senderaccount.addr,
            to: receiverAddr,
            amount: amount,
            suggestedParams: params,
            note: note,
        });
        const txId = yield submitTransaction(txn, senderaccount.sk);
        return txId;
    });
}
exports.sendAlgo = sendAlgo;
//fetches and decodes the logs returned in the transaction Hash
function getTransactionReference(txId) {
    return __awaiter(this, void 0, void 0, function* () {
        const transaction = yield exports.algoIndexer
            .lookupApplicationLogs(config_1.appId)
            .txid(txId)
            .do();
        const encoded = transaction["log-data"][0]["logs"][0];
        var d = Buffer.from(encoded, "base64");
        const returnedType = Array(12).fill(new algosdk_1.ABIUintType(64));
        returnedType[9] = new algosdk_1.ABIAddressType();
        const tupleType = new algosdk_1.ABITupleType(returnedType);
        return {
            decoded: tupleType.decode(new Uint8Array(d).slice(4)),
            caller: transaction["sender"],
            round: transaction["confirmed-round"],
        };
    });
}
exports.getTransactionReference = getTransactionReference;
function checkUserOptedIn(userAddr, appId) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = [];
        var data = yield exports.algoIndexer.lookupAccountAppLocalStates(userAddr).do();
        var nextToken = data["next-token"];
        var dataLength = data["apps-local-states"].length;
        //@ts-ignore
        response.push(...data["apps-local-states"]);
        while (dataLength > 0) {
            var data = yield exports.algoIndexer
                .lookupAccountAppLocalStates(userAddr)
                .nextToken(nextToken)
                .do();
            nextToken = data["next-token"];
            dataLength = data["apps-local-states"].length;
            //@ts-ignore
            response.push(...data["apps-local-states"]);
        }
        return response.find((localState) => localState.id == appId);
    });
}
exports.checkUserOptedIn = checkUserOptedIn;
//add while loop to this to include next token
//This only fetches app calls
function getUserTransactionstoApp(userAddr, appId) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer
            .searchForTransactions()
            .address(userAddr)
            .applicationID(appId)
            .do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            data = yield exports.algoIndexer
                .searchForTransactions()
                .address(userAddr)
                .applicationID(appId)
                .nextToken(nextToken)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return txns;
    });
}
exports.getUserTransactionstoApp = getUserTransactionstoApp;
function getUserTransactionstoAppBetweenRounds(userAddr, appId, minRound, maxRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer
            .searchForTransactions()
            .address(userAddr)
            .applicationID(appId)
            .minRound(minRound)
            .maxRound(maxRound)
            .do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            var data = yield exports.algoIndexer
                .searchForTransactions()
                .address(userAddr)
                .applicationID(appId)
                .nextToken(nextToken)
                .minRound(minRound)
                .maxRound(maxRound)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return txns;
    });
}
exports.getUserTransactionstoAppBetweenRounds = getUserTransactionstoAppBetweenRounds;
function getAppPayTransactions(appAddr, notePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer.searchForTransactions().address(appAddr).do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            var data = yield exports.algoIndexer
                .searchForTransactions()
                .address(appAddr)
                .nextToken(nextToken)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return notePrefix == undefined
            ? txns
            : txns.filter((txn) => txn.note == notePrefix);
    });
}
exports.getAppPayTransactions = getAppPayTransactions;
function getAppPayTransactionsBetweenRounds(appAddr, minRound, maxRound, notePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer
            .searchForTransactions()
            .address(appAddr)
            .minRound(minRound)
            .maxRound(maxRound)
            .do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            var data = yield exports.algoIndexer
                .searchForTransactions()
                .address(appAddr)
                .nextToken(nextToken)
                .minRound(minRound)
                .maxRound(maxRound)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return notePrefix == undefined
            ? txns
            : txns.filter((txn) => txn.note == notePrefix);
    });
}
exports.getAppPayTransactionsBetweenRounds = getAppPayTransactionsBetweenRounds;
function getAppPayTransactionsFromRound(appAddr, minRound, notePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer
            .searchForTransactions()
            .address(appAddr)
            .minRound(minRound)
            .do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            var data = yield exports.algoIndexer
                .searchForTransactions()
                .address(appAddr)
                .minRound(minRound)
                .nextToken(nextToken)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return notePrefix == undefined
            ? txns
            : txns.filter((txn) => txn.note == notePrefix);
    });
}
exports.getAppPayTransactionsFromRound = getAppPayTransactionsFromRound;
function getAppCreateGameTransactions(appAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = yield getAppPayTransactions(appAddr, Buffer.from(enc.encode("init_game")).toString("base64"));
        return txns;
    });
}
exports.getAppCreateGameTransactions = getAppCreateGameTransactions;
function getAppCreateGameTransactionsBetweenRounds(appAddr, minRound, maxRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = yield getAppPayTransactionsBetweenRounds(appAddr, minRound, maxRound, Buffer.from(enc.encode("init_game")).toString("base64"));
        return txns;
    });
}
exports.getAppCreateGameTransactionsBetweenRounds = getAppCreateGameTransactionsBetweenRounds;
function getAppCreateGameTransactionsFromRound(appAddr, minRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = yield getAppPayTransactionsFromRound(appAddr, minRound, Buffer.from(enc.encode("init_game")).toString("base64"));
        return txns;
    });
}
exports.getAppCreateGameTransactionsFromRound = getAppCreateGameTransactionsFromRound;
function getAppEnterGameTransactions(appAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = yield getAppPayTransactions(appAddr, Buffer.from(enc.encode("enter_game")).toString("base64"));
        return txns;
    });
}
exports.getAppEnterGameTransactions = getAppEnterGameTransactions;
function getAppEnterGameTransactionsBetweenRounds(appAddr, minRound, maxRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = yield getAppPayTransactionsBetweenRounds(appAddr, minRound, maxRound, Buffer.from(enc.encode("enter_game")).toString("base64"));
        return txns;
    });
}
exports.getAppEnterGameTransactionsBetweenRounds = getAppEnterGameTransactionsBetweenRounds;
function getAppEnterGameTransactionsFromRound(appAddr, minRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = yield getAppPayTransactionsFromRound(appAddr, minRound, Buffer.from(enc.encode("enter_game")).toString("base64"));
        return txns;
    });
}
exports.getAppEnterGameTransactionsFromRound = getAppEnterGameTransactionsFromRound;
function getAppPayWinnerTransactions(appAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = (yield getAppPayTransactions(appAddr))
            .map((txn) => txn["inner-txns"])
            .filter((innerTxn) => innerTxn.note ==
            Buffer.from(enc.encode("pay_winner")).toString("base64"));
        return txns;
    });
}
exports.getAppPayWinnerTransactions = getAppPayWinnerTransactions;
function getAppPayWinnerTransactionsBetweenRounds(appAddr, minRound, maxRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = (yield getAppPayTransactionsBetweenRounds(appAddr, minRound, maxRound))
            .map((txn) => txn["inner-txns"])
            .filter((innerTxn) => innerTxn.note ==
            Buffer.from(enc.encode("pay_winner")).toString("base64"));
        return txns;
    });
}
exports.getAppPayWinnerTransactionsBetweenRounds = getAppPayWinnerTransactionsBetweenRounds;
function getAppPayWinnerTransactionsFromRound(appAddr, minRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const enc = new TextEncoder();
        const txns = (yield getAppPayTransactionsFromRound(appAddr, minRound))
            .map((txn) => txn["inner-txns"])
            .filter((innerTxn) => innerTxn.note ==
            Buffer.from(enc.encode("pay_winner")).toString("base64"));
        return txns;
    });
}
exports.getAppPayWinnerTransactionsFromRound = getAppPayWinnerTransactionsFromRound;
function getAppGenerateRandomNumberTransactions() {
    return __awaiter(this, void 0, void 0, function* () { });
}
exports.getAppGenerateRandomNumberTransactions = getAppGenerateRandomNumberTransactions;
function getAppCallTransactions(appId) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer
            .searchForTransactions()
            .applicationID(appId)
            .do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            var data = yield exports.algoIndexer
                .searchForTransactions()
                .applicationID(appId)
                .nextToken(nextToken)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return txns;
    });
}
exports.getAppCallTransactions = getAppCallTransactions;
function getAppCallTransactionsBetweenRounds(appId, minRound, maxRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer
            .searchForTransactions()
            .applicationID(appId)
            .minRound(minRound)
            .maxRound(maxRound)
            .do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            var data = yield exports.algoIndexer
                .searchForTransactions()
                .applicationID(appId)
                .nextToken(nextToken)
                .minRound(minRound)
                .maxRound(maxRound)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return txns;
    });
}
exports.getAppCallTransactionsBetweenRounds = getAppCallTransactionsBetweenRounds;
function getAppCallTransactionsFromRound(appId, minRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const txns = [];
        var data = yield exports.algoIndexer
            .searchForTransactions()
            .applicationID(appId)
            .minRound(minRound)
            .do();
        var nextToken = data["next-token"];
        var txLength = data["transactions"].length;
        //@ts-ignore
        txns.push(...data["transactions"]);
        while (txLength > 0) {
            var data = yield exports.algoIndexer
                .searchForTransactions()
                .applicationID(appId)
                .nextToken(nextToken)
                .minRound(minRound)
                .do();
            nextToken = data["next-token"];
            txLength = data["transactions"].length;
            //@ts-ignore
            txns.push(...data["transactions"]);
            yield sleep(0.4);
        }
        return txns;
    });
}
exports.getAppCallTransactionsFromRound = getAppCallTransactionsFromRound;
