"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEncryptedData = exports.encryptData = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcrypt_1 = __importDefault(require("bcrypt"));
const errorHandler_1 = require("../middlewares/errorHandler");
const encryptData = async (rawPassword) => {
    return await bcrypt_1.default.hash(rawPassword, Number(process.env.PasswordEncrptRounds));
};
exports.encryptData = encryptData;
const verifyEncryptedData = async (rawData, encryptedData) => {
    const isPasswordCorrect = await bcrypt_1.default.compare(rawData, encryptedData);
    if (!isPasswordCorrect)
        throw new errorHandler_1.AppError("Invalid password", 401);
};
exports.verifyEncryptedData = verifyEncryptedData;
