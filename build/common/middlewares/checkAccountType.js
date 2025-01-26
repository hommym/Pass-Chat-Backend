"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAccountType = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const objects_1 = require("../constants/objects");
const errorHandler_1 = require("./errorHandler");
const checkAccountType = (acountType) => {
    return (0, express_async_handler_1.default)(async (req, res, next) => {
        const { verifiedUserId } = req.body;
        const account = await objects_1.database.user.findUnique({ where: { id: verifiedUserId, type: acountType } });
        if (!account)
            throw new errorHandler_1.AppError("User Not Authorized", 401);
        next();
    });
};
exports.checkAccountType = checkAccountType;
