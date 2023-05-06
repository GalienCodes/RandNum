"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LottoGameArgsDecoder = void 0;
const algosdk_1 = require("algosdk");
class LottoGameArgsDecoder {
    constructor() {
        this.encodedMethods = [];
        this.decodedMethods = [];
        const initializeGameABI = new algosdk_1.ABIMethod({
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
        this.encodedMethods.push(Buffer.from(initializeGameABI.getSelector()).toString("base64"));
        this.decodedMethods.push(initializeGameABI.name);
        const enterGameABI = new algosdk_1.ABIMethod({
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
        this.encodedMethods.push(Buffer.from(enterGameABI.getSelector()).toString("base64"));
        this.decodedMethods.push(enterGameABI.name);
        const changegNumberABI = new algosdk_1.ABIMethod({
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
        this.encodedMethods.push(Buffer.from(changegNumberABI.getSelector()).toString("base64"));
        this.decodedMethods.push(changegNumberABI.name);
        const generateLuckyNumberABI = new algosdk_1.ABIMethod({
            name: "generate_lucky_number",
            args: [
                {
                    type: "application",
                    name: "application_Id",
                },
            ],
            returns: {
                type: "void",
            },
        });
        this.encodedMethods.push(Buffer.from(generateLuckyNumberABI.getSelector()).toString("base64"));
        this.decodedMethods.push(generateLuckyNumberABI.name);
        const checkUserWinLotteryABI = new algosdk_1.ABIMethod({
            name: "check_user_win_lottery",
            args: [
                {
                    type: "account",
                    name: "player",
                },
            ],
            returns: {
                type: "bool",
            },
        });
        this.encodedMethods.push(Buffer.from(checkUserWinLotteryABI.getSelector()).toString("base64"));
        this.decodedMethods.push(checkUserWinLotteryABI.name);
    }
    decodeMethod(encodedMethod) {
        const index = this.encodedMethods.findIndex((method) => method == encodedMethod);
        if (index == -1) {
            return null;
        }
        return this.decodedMethods[index];
    }
}
exports.LottoGameArgsDecoder = LottoGameArgsDecoder;
