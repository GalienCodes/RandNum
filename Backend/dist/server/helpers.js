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
exports.checkAllPlayersWin = exports.endCurrentAndCreateNewGame = exports.checkPlayerWinStatus = exports.decodeTxReference = exports.getGameParamsById = exports.getCurrentGameParam = exports.generateLuckyNumber = exports.getCurrentGeneratedNumber = exports.getPlayerChangeGuessNumber = exports.getPlayerCurrentGuessNumber = exports.getLottoPayTxn = exports.getLottoPayTxnById = exports.getLottoCallsById = exports.getUserHistoryByLottoId = exports.getUserLottoHistory = void 0;
const algosdk_1 = require("algosdk");
const config_1 = require("../scripts/config");
const decode_1 = require("../scripts/decode");
const lottoCall_1 = require("../scripts/lottoCall");
const utils_1 = require("../scripts/utils");
const lottoHistory_1 = require("./models/lottoHistory");
function parseLottoTxn(userTxns) {
    const decoder = new decode_1.LottoGameArgsDecoder();
    const filteredAndParsed = userTxns
        .filter((userTxn) => decoder.encodedMethods.includes(userTxn["application-transaction"]["application-args"][0]))
        .map((userTxn) => {
        const action = decoder.decodeMethod(userTxn["application-transaction"]["application-args"][0]);
        var value;
        if (action == "check_user_win_lottery") {
            value =
                userTxn["application-transaction"]["accounts"][0] ||
                    userTxn["sender"];
        }
        else if (action == "initiliaze_game_params") {
            const initParams = userTxn["application-transaction"]["application-args"]
                .slice(1, 8)
                .map((arg) => (0, algosdk_1.decodeUint64)(Buffer.from(arg, "base64"), "mixed"));
            value = {
                ticketingStart: initParams[0],
                ticketingDuration: initParams[1],
                ticketFee: initParams[2],
                withdrawalStart: initParams[3],
                win_multiplier: initParams[4],
                max_guess_number: initParams[5],
                max_players_allowed: initParams[6],
            };
        }
        else if (action == "change_guess_number" || action == "enter_game") {
            value = (0, algosdk_1.decodeUint64)(Buffer.from(userTxn["application-transaction"]["application-args"][1], "base64"), "mixed");
        }
        return {
            userAddr: userTxn["sender"],
            action: action,
            value: value,
            txId: userTxn["id"],
            round: userTxn["confirmed-round"],
        };
    });
    return filteredAndParsed;
}
function getUserLottoHistory(userAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userTxns = yield (0, utils_1.getUserTransactionstoApp)(userAddr, config_1.appId);
            const userInteractions = parseLottoTxn(userTxns).filter((parsedTxns) => parsedTxns.value != undefined);
            const data = {};
            const filtered = yield Promise.all(userInteractions.map((userInteraction) => __awaiter(this, void 0, void 0, function* () {
                const lottoDetails = yield lottoHistory_1.LottoModel.findOne({
                    roundEnd: { $gte: userInteraction.round },
                    roundStart: { $lte: userInteraction.round },
                });
                const lottoId = (lottoDetails === null || lottoDetails === void 0 ? void 0 : lottoDetails.lottoId) || -1;
                const lottoParams = lottoDetails === null || lottoDetails === void 0 ? void 0 : lottoDetails.gameParams;
                if (!data[String(lottoId)]) {
                    data[String(lottoId)] = {
                        userInteractions: [userInteraction],
                        lottoParams: lottoParams,
                        id: lottoDetails === null || lottoDetails === void 0 ? void 0 : lottoDetails.id,
                    };
                }
                else {
                    data[String(lottoId)]["userInteractions"].push(userInteraction);
                }
            })));
            return data;
        }
        catch (error) {
            console.log(error);
            return {};
        }
    });
}
exports.getUserLottoHistory = getUserLottoHistory;
function getUserHistoryByLottoId(lottoId, userAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const betHistoryDetails = yield lottoHistory_1.LottoModel.findOne({ lottoId: lottoId });
            var lottoMinRound;
            var lottoMaxRound;
            var userTxns;
            if (betHistoryDetails) {
                lottoMinRound = betHistoryDetails.roundStart;
                lottoMaxRound = betHistoryDetails.roundEnd;
                userTxns = yield (0, utils_1.getUserTransactionstoAppBetweenRounds)(userAddr, config_1.appId, lottoMinRound, lottoMaxRound);
            }
            else {
                return {};
            }
            const userInteractions = parseLottoTxn(userTxns).filter((parsedTxns) => parsedTxns.value != undefined);
            return {
                [String(lottoId)]: {
                    userInteractions: userInteractions,
                    lottoParams: betHistoryDetails === null || betHistoryDetails === void 0 ? void 0 : betHistoryDetails.gameParams,
                    id: betHistoryDetails === null || betHistoryDetails === void 0 ? void 0 : betHistoryDetails.id,
                },
            };
        }
        catch (error) {
            console.log(error);
            return {};
        }
    });
}
exports.getUserHistoryByLottoId = getUserHistoryByLottoId;
function getLottoCallsById(lottoId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const betHistoryDetails = yield lottoHistory_1.LottoModel.findOne({ lottoId: lottoId });
            if (betHistoryDetails) {
                const lottoMinRound = betHistoryDetails.roundStart;
                const lottoMaxRound = betHistoryDetails.roundEnd;
                const lottoTxns = yield (0, utils_1.getAppCallTransactionsBetweenRounds)(config_1.appId, lottoMinRound, lottoMaxRound);
                const lottoInteractions = parseLottoTxn(lottoTxns).filter((parsedTxns) => parsedTxns.value);
                return {
                    [String(lottoId)]: {
                        userInteractions: lottoInteractions.filter((interaction) => interaction.action == "initiliaze_game_params" ||
                            interaction.action == "generate_lucky_number"),
                        lottoParams: betHistoryDetails === null || betHistoryDetails === void 0 ? void 0 : betHistoryDetails.gameParams,
                    },
                };
            }
            else {
                return [];
            }
        }
        catch (error) {
            return [];
        }
    });
}
exports.getLottoCallsById = getLottoCallsById;
function getLottoPayTxnById(lottoId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const betHistoryDetails = yield lottoHistory_1.LottoModel.findOne({ lottoId: lottoId });
            if (betHistoryDetails) {
                const lottoMinRound = betHistoryDetails.roundStart;
                const lottoMaxRound = betHistoryDetails.roundEnd;
                const receivedTxns = yield (0, utils_1.getAppEnterGameTransactionsBetweenRounds)(config_1.appAddr, lottoMinRound, lottoMaxRound);
                const sentTxns = yield (0, utils_1.getAppPayWinnerTransactionsBetweenRounds)(config_1.appAddr, lottoMinRound, lottoMaxRound);
                return { receivedTxns: receivedTxns, sentTxns: sentTxns };
            }
            else {
                return { receivedTxns: [], sentTxns: [] };
            }
        }
        catch (error) {
            console.log(error);
            return { receivedTxns: [], sentTxns: [] };
        }
    });
}
exports.getLottoPayTxnById = getLottoPayTxnById;
function getLottoPayTxn() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const receivedTxns = yield (0, utils_1.getAppEnterGameTransactions)(config_1.appAddr);
            const sentTxns = yield (0, utils_1.getAppPayWinnerTransactions)(config_1.appAddr);
            return { receivedTxns: receivedTxns, sentTxns: sentTxns };
        }
        catch (error) {
            console.log(error);
            return { receivedTxns: [], sentTxns: [] };
        }
    });
}
exports.getLottoPayTxn = getLottoPayTxn;
function getPlayerCurrentGuessNumber(userAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, lottoCall_1.getUserGuessNumber)(userAddr);
        return result;
    });
}
exports.getPlayerCurrentGuessNumber = getPlayerCurrentGuessNumber;
function getPlayerChangeGuessNumber(userAddr, newGuessNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, lottoCall_1.changeCurrentGameNumber)(userAddr, newGuessNumber);
        return result;
    });
}
exports.getPlayerChangeGuessNumber = getPlayerChangeGuessNumber;
function getCurrentGeneratedNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, lottoCall_1.getGeneratedLuckyNumber)();
        return result;
    });
}
exports.getCurrentGeneratedNumber = getCurrentGeneratedNumber;
function generateLuckyNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        const gameParams = yield getCurrentGameParam();
        //only when there is a current game being played and we are in the random number generation stage
        if (gameParams.ticketingStart != 0 &&
            gameParams.luckyNumber == 0 &&
            gameParams.ticketingStart + gameParams.ticketingDuration <
                Math.round(Date.now() / 1000)) {
            const result = yield (0, lottoCall_1.generateRandomNumber)();
            return result;
        }
        else {
            console.log("Can not generate random number in this phase of game");
            return { status: false };
        }
    });
}
exports.generateLuckyNumber = generateLuckyNumber;
function getCurrentGameParam() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, lottoCall_1.getGameParams)();
        const gameParams = {
            ticketingStart: 0,
            ticketingDuration: 0,
            withdrawalStart: 0,
            ticketFee: 0,
            luckyNumber: 0,
            playersTicketBought: 0,
            winMultiplier: 0,
            maxGuessNumber: 0,
            maxPlayersAllowed: 0,
            gameMaster: "",
            playersTicketChecked: 0,
            totalGamePlayed: 0,
        };
        const gameParamsKey = [
            "ticketingStart",
            "ticketingDuration",
            "withdrawalStart",
            "ticketFee",
            "luckyNumber",
            "playersTicketBought",
            "winMultiplier",
            "maxGuessNumber",
            "maxPlayersAllowed",
            "gameMaster",
            "playersTicketChecked",
            "totalGamePlayed",
        ];
        gameParamsKey.forEach(
        //@ts-ignore
        (gameParamKey, i) => 
        //@ts-ignore
        (gameParams[gameParamKey] = Number.isNaN(Number(data.data[i]))
            ? //@ts-ignore
                String(data.data[i])
            : //@ts-ignore
                Number(data.data[i])));
        return gameParams;
    });
}
exports.getCurrentGameParam = getCurrentGameParam;
function getGameParamsById(lottoId) {
    return __awaiter(this, void 0, void 0, function* () {
        const betHistoryDetails = yield lottoHistory_1.LottoModel.findOne({ lottoId: lottoId });
        return betHistoryDetails;
    });
}
exports.getGameParamsById = getGameParamsById;
function decodeTxReference(txId) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, utils_1.getTransactionReference)(txId);
        return data;
    });
}
exports.decodeTxReference = decodeTxReference;
function checkPlayerWinStatus(playerAddr) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, lottoCall_1.checkUserWinLottery)(playerAddr);
        return data;
    });
}
exports.checkPlayerWinStatus = checkPlayerWinStatus;
function endCurrentAndCreateNewGame(ticketingStart = Math.round(Date.now() / 1000 + 200), ticketingDuration = 3600, withdrawalStart = ticketingStart + 4600, ticketFee = 2e6, winMultiplier = 2, maxPlayersAllowed = 20, maxGuessNumber = 100000, gameMasterAddr = config_1.user.addr) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield (0, lottoCall_1.getGameParams)();
        if (!(data === null || data === void 0 ? void 0 : data.status) || !data.data) {
            return { newLottoDetails: {}, newGame: { status: false, txns: [] } };
        }
        //@ts-ignore
        const gameParams = {};
        const gameParamsKey = [
            "ticketingStart",
            "ticketingDuration",
            "withdrawalStart",
            "ticketFee",
            "luckyNumber",
            "playersTicketBought",
            "winMultiplier",
            "maxGuessNumber",
            "maxPlayersAllowed",
            "gameMaster",
            "playersTicketChecked",
            "totalGamePlayed",
        ];
        gameParamsKey.forEach((gameParamKey, i) => 
        //@ts-ignore
        (gameParams[gameParamKey] = Number.isNaN(Number(data.data[i]))
            ? //@ts-ignore
                String(data.data[i])
            : //@ts-ignore
                Number(data.data[i])));
        const lottoId = Number(gameParams.totalGamePlayed);
        // Only reset game when there has been a game played(just initialize game)
        if (gameParams.ticketingStart == 0) {
            console.log("No new game was played on contract");
            const success = yield (0, lottoCall_1.initializeGameParams)(gameMasterAddr, BigInt(ticketingStart), ticketingDuration, ticketFee, winMultiplier, maxGuessNumber, maxPlayersAllowed, config_1.appAddr, BigInt(withdrawalStart));
            return { newLottoDetails: {}, newGame: success };
        }
        //if game is not yet over do not restart
        if (gameParams.withdrawalStart > Math.round(Date.now() / 1000) ||
            gameParams.playersTicketBought != gameParams.playersTicketChecked) {
            console.log("Current Game not finished");
            return { newLottoDetails: {}, newGame: { status: false, txns: [] } };
        }
        const resetStatus = yield (0, lottoCall_1.resetGameParams)(config_1.appAddr, gameParams.gameMaster, config_1.user.addr);
        if (!resetStatus.status || !resetStatus.confirmedRound) {
            return { newLottoDetails: {}, newGame: { status: false, txns: [] } };
        }
        const betHistoryDetails = yield lottoHistory_1.LottoModel.findOne({ lottoId: lottoId });
        const prevbetHistoryDetails = yield lottoHistory_1.LottoModel.findOne({
            lottoId: lottoId - 1,
        });
        if (!betHistoryDetails) {
            yield lottoHistory_1.LottoModel.create({
                lottoId: lottoId,
                roundStart: (prevbetHistoryDetails === null || prevbetHistoryDetails === void 0 ? void 0 : prevbetHistoryDetails.roundEnd) || 0,
                roundEnd: resetStatus.confirmedRound,
                gameParams: gameParams,
                txReference: data.txId,
            });
        }
        else {
            betHistoryDetails.gameParams = gameParams;
            betHistoryDetails.roundEnd = resetStatus.confirmedRound;
            betHistoryDetails.txReference = data.txId;
            yield betHistoryDetails.save();
        }
        var newLotto = yield lottoHistory_1.LottoModel.findOne({ lottoId: lottoId + 1 });
        if (!newLotto) {
            newLotto = yield lottoHistory_1.LottoModel.create({
                lottoId: lottoId + 1,
                roundStart: resetStatus.confirmedRound,
            });
        }
        const success = yield (0, lottoCall_1.initializeGameParams)(gameMasterAddr, BigInt(ticketingStart), ticketingDuration, ticketFee, winMultiplier, maxGuessNumber, maxPlayersAllowed, config_1.appAddr, BigInt(withdrawalStart));
        return { newLottoDetails: newLotto, newGame: success };
    });
}
exports.endCurrentAndCreateNewGame = endCurrentAndCreateNewGame;
function checkAllPlayersWin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const gameParams = yield getCurrentGameParam();
            const lottoId = gameParams.totalGamePlayed;
            if (gameParams.withdrawalStart != 0 &&
                gameParams.withdrawalStart < Math.round(Date.now() / 1000)) {
                console.log("Checking win status");
                const lotto = yield lottoHistory_1.LottoModel.findOne({ lottoId: lottoId });
                const minRound = (lotto === null || lotto === void 0 ? void 0 : lotto.roundStart) || 0;
                const playerPayTxns = yield (0, utils_1.getAppEnterGameTransactionsFromRound)(config_1.appAddr, minRound);
                const potentialPlayers = playerPayTxns.map((txn) => txn.sender);
                const playerCallTxns = yield (0, utils_1.getAppCallTransactionsFromRound)(config_1.appId, minRound);
                const checkedAddresses = parseLottoTxn(playerCallTxns)
                    .filter((parsedTxns) => parsedTxns.action == "check_user_win_lottery")
                    .map((parsedTxn) => parsedTxn.value);
                var uncheckedAddresses = potentialPlayers.filter((player) => !checkedAddresses.includes(player));
                uncheckedAddresses = [...new Set(uncheckedAddresses)];
                const chunkSize = 25;
                for (let i = 0; i < uncheckedAddresses.length; i += chunkSize) {
                    const chunk = uncheckedAddresses.slice(i, i + chunkSize);
                    yield Promise.all(chunk.map((player) => (0, lottoCall_1.checkUserWinLottery)(player)));
                    console.log(`Checked win status for ${i} out of ${uncheckedAddresses.length}`);
                }
                return { status: true };
            }
            else {
                console.log("Not in withdrawal phase.");
                return { status: false };
            }
        }
        catch (error) {
            console.error(error.message);
            return { status: false };
        }
    });
}
exports.checkAllPlayersWin = checkAllPlayersWin;
