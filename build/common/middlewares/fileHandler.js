"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileHandler = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("./errorHandler");
const path_1 = require("path");
const path_2 = require("../helpers/path");
const list_1 = require("../constants/list");
const objects_1 = require("../constants/objects");
exports.fileHandler = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { buffer, mimetype } = req.file;
    const { mediaType, fileName, date } = req.body;
    let dirPath = (0, path_1.join)(__dirname, "..", "..", "..", "/storage");
    dirPath = (0, path_1.join)(dirPath, `/${mediaType}s/${date}/${fileName.split(".")[0]}`);
    if (!(list_1.allowedMediaMimeTypes.includes(mimetype) || list_1.allowedDocumentMimeTypes.includes(mimetype))) {
        throw new errorHandler_1.AppError(`The file type ${mimetype} is supported`, 400);
    }
    else if (await (0, path_2.checkPathExists)(dirPath)) {
        throw new errorHandler_1.AppError("File already exist", 409);
    }
    await objects_1.fileService.saveFile(dirPath, buffer, fileName.split(".")[1]);
    next();
});
