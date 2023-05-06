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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv = __importStar(require("dotenv"));
const lotto_1 = require("./router/lotto");
const gameManager_1 = require("../workers/gameManager");
const config_1 = require("../scripts/config");
dotenv.config();
const uri = config_1.MODE == "PRODUCTION"
    ? String(process.env.MONGO_CONNECTION_STRING)
    : "mongodb://localhost:27017/RandNum";
const PORT = parseInt(process.env.PORT) || 3000;
(function run() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.client = yield (0, config_1.initRedis)();
    });
})();
mongoose_1.default
    .connect(uri, {})
    .then(() => {
    console.log("Connected to the database");
})
    .catch((err) => {
    console.error("Couldn'to connect to database");
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, body_parser_1.json)());
app.use((0, morgan_1.default)("dev"));
app.get("/", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.status(200).send({
            status: "Up and running",
        });
    });
});
app.use("/lottoGame", lotto_1.lottoRouter);
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    gameManager_1.restartGame.start();
    gameManager_1.checkUserWin.start();
    gameManager_1.generateNumber.start();
    console.log(`Listening on ${PORT}`);
}));
