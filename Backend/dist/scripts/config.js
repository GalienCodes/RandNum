"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.initRedis = exports.MODE = exports.REDIS_PORT = exports.REDIS_USERNAME = exports.REDIS_HOST = exports.REDIS_PASSWORD = exports.randomnessBeaconContract = exports.appAddr = exports.appId = exports.player = exports.user = exports.API_KEY = void 0;
const algosdk_1 = require("algosdk");
const dotenv = __importStar(require("dotenv"));
const redis_1 = require("redis");
dotenv.config();
const ADMIN_MNEMONIC = String(process.env.ADMIN_MNEMONIC);
exports.API_KEY = String(process.env.API_KEY);
const APP_ID = Number(process.env.APP_ID);
exports.user = (0, algosdk_1.mnemonicToSecretKey)(ADMIN_MNEMONIC);
exports.player = (0, algosdk_1.mnemonicToSecretKey)("tuna task minimum either please faculty sport regret seven motor hard hold diary flight distance around carry legend alpha budget decorate office chuckle absent rough");
exports.appId = APP_ID;
exports.appAddr = (0, algosdk_1.getApplicationAddress)(APP_ID);
exports.randomnessBeaconContract = 110096026;
exports.REDIS_PASSWORD = String(process.env.REDIS_PASSWORD);
exports.REDIS_HOST = String(process.env.REDIS_HOST);
exports.REDIS_USERNAME = String(process.env.REDIS_USERNAME);
exports.REDIS_PORT = Number(process.env.REDIS_PORT);
exports.MODE = String(process.env.MODE);
function initRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        var client;
        if (exports.MODE == "PRODUCTION") {
            client = (0, redis_1.createClient)({
                url: `redis://${exports.REDIS_USERNAME}:${exports.REDIS_PASSWORD}@${exports.REDIS_HOST}:${exports.REDIS_PORT}`, //comment out if not in production
            });
        }
        else {
            client = (0, redis_1.createClient)({
            // url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`, //comment out if not in production
            });
        }
        client.on("error", (err) => console.log(err));
        yield client.connect();
        return client;
    });
}
exports.initRedis = initRedis;
