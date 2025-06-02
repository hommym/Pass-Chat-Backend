"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyValidator = bodyValidator;
exports.bodyValidatorWs = bodyValidatorWs;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("./errorHandler");
function bodyValidator(type) {
    return (0, express_async_handler_1.default)(async (req, res, next) => {
        // console.log(`ReqBody=${req.body}`)
        const dtoInstance = (0, class_transformer_1.plainToInstance)(type, req.body, { excludeExtraneousValues: true });
        const errors = await (0, class_validator_1.validate)(dtoInstance);
        if (errors.length > 0) {
            console.log(errors);
            throw new errorHandler_1.AppError("Invalid Request Body", 400);
        }
        // Replace the body with the filtered DTO instance
        req.body = dtoInstance;
        next();
    });
}
async function bodyValidatorWs(type, data) {
    const dtoInstance = (0, class_transformer_1.plainToInstance)(type, data, { excludeExtraneousValues: true });
    const errors = await (0, class_validator_1.validate)(dtoInstance);
    if (errors.length > 0) {
        console.log(errors);
        throw new errorHandler_1.WsError("Websocket Request Body Invalid");
    }
}
