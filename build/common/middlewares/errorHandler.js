"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.WsError = exports.AppError = void 0;
const multer_1 = require("multer");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
class WsError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.WsError = WsError;
const errorHandler = async (err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
    }
    else if (err instanceof SyntaxError) {
        res.status(400).json({ error: err.message });
    }
    else if (err instanceof multer_1.MulterError) {
        res.status(400).json({ error: `${err.message} for uploaded file` });
    }
    else {
        console.log(err);
        res.status(500).json({ error: "Server Error" });
    }
};
exports.errorHandler = errorHandler;
