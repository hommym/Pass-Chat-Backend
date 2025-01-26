"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtForWsConnectionId = exports.jwtForOtp = exports.verifyJwtToken = exports.jwtForLogIn = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../middlewares/errorHandler");
const jwtForLogIn = (id, exp = null) => {
    if (process.env.JwtSecretKey !== undefined) {
        return jsonwebtoken_1.default.sign({ userId: id }, process.env.JwtSecretKey, { expiresIn: exp ? exp : "36500d" });
    }
    else {
        console.log("env variable JwtSecretKey not defined on server");
        throw new errorHandler_1.AppError("Server errror", 500);
    }
};
exports.jwtForLogIn = jwtForLogIn;
const verifyJwtToken = (token) => {
    if (process.env.JwtSecretKey !== undefined) {
        return jsonwebtoken_1.default.verify(token, process.env.JwtSecretKey);
    }
    else {
        throw new errorHandler_1.AppError("env variable JwtSecretKey not defined on server", 500);
    }
};
exports.verifyJwtToken = verifyJwtToken;
const jwtForOtp = (otpCode) => {
    if (process.env.JwtSecretKey !== undefined) {
        return jsonwebtoken_1.default.sign({ otpCode }, process.env.JwtSecretKey, { expiresIn: 300000 });
    }
    else {
        console.log("env variable JwtSecretKey not defined on server");
        throw new errorHandler_1.AppError("Server errror", 500);
    }
};
exports.jwtForOtp = jwtForOtp;
const jwtForWsConnectionId = (connectionId) => {
    if (process.env.JwtSecretKey !== undefined) {
        return jsonwebtoken_1.default.sign({ connectionId }, process.env.JwtSecretKey, { expiresIn: 300000 });
    }
    else {
        console.log("env variable JwtSecretKey not defined on server");
        throw new errorHandler_1.AppError("Server errror", 500);
    }
};
exports.jwtForWsConnectionId = jwtForWsConnectionId;
