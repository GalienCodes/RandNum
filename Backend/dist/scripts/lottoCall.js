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
exports.resetGameParams = exports.initializeGameParams = exports.getMinAmountToStartGame = exports.getGeneratedLuckyNumber = exports.generateRandomNumber = exports.getUserGuessNumber = exports.checkUserWinLottery = exports.getGameParams = exports.getTotalGamesPlayed = exports.call = exports.changeCurrentGameNumber = exports.enterCurrentGame = void 0;
const algosdk_1 = require("algosdk");
const config_1 = require("./config");
const utils_1 = require("./utils");
// import { appId, user } from "./config";
const utils_2 = require("./utils");
function OptIn(user, appId) {
    return __awaiter(this, void 0, void 0, function* () {
        let txId;
        let txn;
        // get transaction params
        const params = yield utils_2.algodClient.getTransactionParams().do();
        // deposit
        //@ts-ignore
        const enc = new TextEncoder();
        const depositAmount = 1e6; // 1 ALGO
        // create and send OptIn
        txn = (0, algosdk_1.makeApplicationOptInTxn)(user.addr, params, appId);
        txId = yield (0, utils_2.submitTransaction)(txn, user.sk);
        // display results
        let transactionResponse = yield utils_2.algodClient
            .pendingTransactionInformation(txId)
            .do();
        console.log("Opted-in to app-id:", transactionResponse["txn"]["txn"]["apid"]);
    });
}
function enterCurrentGame(playerAddr, guessNumber, ticketFee) {
    return __awaiter(this, void 0, void 0, function* () {
        // string parameter
        const params = yield utils_2.algodClient.getTransactionParams().do();
        const enc = new TextEncoder();
        const ticketTXn = (0, algosdk_1.makePaymentTxnWithSuggestedParamsFromObject)({
            suggestedParams: params,
            from: playerAddr,
            to: config_1.appAddr,
            amount: ticketFee,
            note: enc.encode("enter_game"),
        });
        const abi = new algosdk_1.ABIMethod({
            name: "enter_game",
            args: [
                {
                    type: "uint64",
                    name: "guess_number",
                },
                {
                    type: "pay",
                    name: "ticket_txn",
                },
            ],
            returns: {
                type: "void",
            },
        });
        const encodedLuckyNumber = (0, algosdk_1.encodeUint64)(guessNumber);
        var applCallTxn = (0, algosdk_1.makeApplicationOptInTxn)(playerAddr, params, config_1.appId, [
            abi.getSelector(),
            encodedLuckyNumber,
        ]);
        if (yield (0, utils_1.checkUserOptedIn)(playerAddr, config_1.appId)) {
            applCallTxn = (0, algosdk_1.makeApplicationNoOpTxn)(playerAddr, params, config_1.appId, [
                abi.getSelector(),
                encodedLuckyNumber,
            ]);
        }
        return (0, algosdk_1.assignGroupID)([ticketTXn, applCallTxn]);
    });
}
exports.enterCurrentGame = enterCurrentGame;
function changeCurrentGameNumber(playerAddr, newGuessNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = yield utils_2.algodClient.getTransactionParams().do();
        const abi = new algosdk_1.ABIMethod({
            name: "change_guess_number",
            args: [
                {
                    type: "uint64",
                    name: "new_guess_number",
                },
            ],
            returns: {
                type: "void",
            },
        });
        const encodedLuckyNumber = (0, algosdk_1.encodeUint64)(newGuessNumber);
        const applCallTxn = (0, algosdk_1.makeApplicationNoOpTxn)(playerAddr, params, config_1.appId, [
            abi.getSelector(),
            encodedLuckyNumber,
        ]);
        return [applCallTxn];
    });
}
exports.changeCurrentGameNumber = changeCurrentGameNumber;
function call(user, appId, method, methodArgs, fee, OnComplete) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = yield utils_2.algodClient.getTransactionParams().do();
        params.flatFee = true;
        params.fee = fee == undefined ? algosdk_1.ALGORAND_MIN_TX_FEE : fee;
        const commonParams = {
            appID: appId,
            sender: user.addr,
            suggestedParams: params,
            signer: (0, algosdk_1.makeBasicAccountTransactionSigner)(user),
        };
        let atc = new algosdk_1.AtomicTransactionComposer();
        atc.addMethodCall(Object.assign(Object.assign({ method: (0, utils_1.getMethodByName)(method), methodArgs: methodArgs }, commonParams), { onComplete: OnComplete }));
        const result = yield atc.execute(utils_2.algodClient, 1000);
        for (const idx in result.methodResults) {
            // console.log(result.methodResults[idx]);
        }
        return result;
    });
}
exports.call = call;
// console.log(SHA256("Hello").toString(enc.Base64));
// call(user, appId, "generate_lucky_number", [110096026]).catch(console.error);
// call(user, appId, "get_latest_multiple", []).catch(console.error);
function getTotalGamesPlayed() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield call(config_1.user, config_1.appId, "get_total_game_played ", []);
            if (data && data.methodResults[0].returnValue) {
                return parseInt(data.methodResults[0].returnValue.toString());
            }
        }
        catch (error) {
            return { staus: false };
        }
    });
}
exports.getTotalGamesPlayed = getTotalGamesPlayed;
function getGameParams() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield call(config_1.user, config_1.appId, "get_game_params", []);
            if (data && data.methodResults[0].returnValue) {
                return {
                    data: data.methodResults[0].returnValue,
                    txId: data.txIDs[0],
                    status: true,
                };
            }
            return {
                status: false,
            };
        }
        catch (error) {
            return { status: false };
        }
    });
}
exports.getGameParams = getGameParams;
function checkUserWinLottery(userAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield call(config_1.user, config_1.appId, "check_user_win_lottery", [userAddr], 2 * algosdk_1.ALGORAND_MIN_TX_FEE);
            if (data && data.methodResults.length > 0) {
                return {
                    status: true,
                    data: data.methodResults[0].returnValue,
                };
            }
        }
        catch (error) {
            console.log(error.message);
            return { status: false };
        }
    });
}
exports.checkUserWinLottery = checkUserWinLottery;
function getUserGuessNumber(userAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield call(config_1.user, config_1.appId, "get_user_guess_number", [userAddr]);
            if (data && data.methodResults[0].returnValue) {
                return {
                    data: data.methodResults[0].returnValue.toString(),
                };
            }
        }
        catch (error) {
            console.log(error);
            return { status: false };
        }
    });
}
exports.getUserGuessNumber = getUserGuessNumber;
function generateRandomNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield call(config_1.user, config_1.appId, "generate_lucky_number", [config_1.randomnessBeaconContract], 2 * algosdk_1.ALGORAND_MIN_TX_FEE);
            return { status: true };
        }
        catch (error) {
            console.log(error);
            return { status: false };
        }
    });
}
exports.generateRandomNumber = generateRandomNumber;
function getGeneratedLuckyNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield call(config_1.user, config_1.appId, "get_lucky_number", []);
            if (data && data.methodResults[0].returnValue) {
                return {
                    data: data.methodResults[0].returnValue.toString(),
                };
            }
        }
        catch (error) {
            return { status: false };
        }
    });
}
exports.getGeneratedLuckyNumber = getGeneratedLuckyNumber;
function getMinAmountToStartGame(ticketFee, win_multiplier, max_players_allowed) {
    return __awaiter(this, void 0, void 0, function* () {
        const appAccountInfo = yield utils_2.algodClient.accountInformation(config_1.appAddr).do();
        const appSpendableBalance = appAccountInfo.amount - appAccountInfo["min-balance"];
        return ((BigInt(win_multiplier) - BigInt(1)) *
            BigInt(max_players_allowed) *
            BigInt(ticketFee) -
            BigInt(appSpendableBalance));
    });
}
exports.getMinAmountToStartGame = getMinAmountToStartGame;
function initializeGameParams(gameMasterAddr, ticketingStart, ticketingDuration, ticketFee, win_multiplier, max_guess_number, max_players_allowed, lotteryContractAddr, withdrawalStart) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const params = yield utils_2.algodClient.getTransactionParams().do();
            const minAmountToTransfer = yield getMinAmountToStartGame(ticketFee, win_multiplier, max_players_allowed);
            const enc = new TextEncoder();
            const newGameTxn = (0, algosdk_1.makePaymentTxnWithSuggestedParamsFromObject)({
                suggestedParams: params,
                from: gameMasterAddr,
                to: config_1.appAddr,
                amount: minAmountToTransfer <= BigInt(1e6) ? 1e6 : minAmountToTransfer,
                note: enc.encode("init_game"), //for decoding when trying to do profile(exclude init game txns)
            });
            const abi = new algosdk_1.ABIMethod({
                name: "initiliaze_game_params",
                args: [
                    {
                        type: "uint64",
                        name: "ticketing_start",
                    },
                    {
                        type: "uint64",
                        name: "ticketing_duration",
                    },
                    {
                        type: "uint64",
                        name: "ticket_fee",
                    },
                    {
                        type: "uint64",
                        name: "withdrawal_start",
                    },
                    {
                        type: "uint64",
                        name: "win_multiplier",
                    },
                    {
                        type: "uint64",
                        name: "max_guess_number",
                    },
                    {
                        type: "uint64",
                        name: "max_players_allowed",
                    },
                    {
                        type: "account",
                        name: "lottery_account",
                    },
                    {
                        type: "pay",
                        name: "create_txn",
                    },
                ],
                returns: {
                    type: "void",
                },
            });
            var applCallTxn = (0, algosdk_1.makeApplicationNoOpTxn)(gameMasterAddr, params, config_1.appId, [
                abi.getSelector(),
                (0, algosdk_1.encodeUint64)(ticketingStart),
                (0, algosdk_1.encodeUint64)(ticketingDuration),
                (0, algosdk_1.encodeUint64)(ticketFee),
                (0, algosdk_1.encodeUint64)(withdrawalStart),
                (0, algosdk_1.encodeUint64)(win_multiplier),
                (0, algosdk_1.encodeUint64)(max_guess_number),
                (0, algosdk_1.encodeUint64)(max_players_allowed),
                (0, algosdk_1.encodeUint64)(1).subarray(7, 8),
            ], [lotteryContractAddr]);
            return {
                status: true,
                txns: (0, algosdk_1.assignGroupID)([newGameTxn, applCallTxn]),
            };
        }
        catch (error) {
            console.log(error);
            return { status: false };
        }
    });
}
exports.initializeGameParams = initializeGameParams;
function resetGameParams(lotteryContractAddr, gameMasterAddr, protocolAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield call(config_1.user, config_1.appId, "reset_game_params", [lotteryContractAddr, gameMasterAddr, protocolAddr], 3 * algosdk_1.ALGORAND_MIN_TX_FEE);
            return {
                status: true,
                confirmedRound: data.confirmedRound,
            };
        }
        catch (error) {
            console.log(error);
            return { status: false };
        }
    });
}
exports.resetGameParams = resetGameParams;
