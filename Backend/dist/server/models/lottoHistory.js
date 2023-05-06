"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LottoModel = void 0;
const mongoose_1 = require("mongoose");
const LottoSchema = new mongoose_1.Schema({
    lottoId: {
        required: true,
        unique: true,
        type: Number,
    },
    gameParams: { type: Object },
    roundStart: {
        required: true,
        type: Number,
    },
    roundEnd: {
        type: Number,
    },
    txReference: {},
});
exports.LottoModel = (0, mongoose_1.model)("LottoModel", LottoSchema);
