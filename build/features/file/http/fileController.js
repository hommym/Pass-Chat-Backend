"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileRouter = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const multer_1 = require("../../../common/libs/multer");
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const uploadFileDto_1 = require("../dtos/uploadFileDto");
const objects_1 = require("../../../common/constants/objects");
const fileHandler_1 = require("../../../common/middlewares/fileHandler");
exports.fileRouter = (0, express_1.Router)();
exports.fileRouter.post("/upload", (0, multer_1.getFile)("file"), verifyJwt_1.verifyJwt, (0, bodyValidator_1.bodyValidator)(uploadFileDto_1.UploadFileDto), fileHandler_1.fileHandler, (0, express_async_handler_1.default)(async (req, res) => {
    const { date, mediaType, fileName } = req.body;
    res.status(201).json({ link: `${process.env.BackendUrl}/file/${mediaType}/${date}/${fileName}` });
}));
exports.fileRouter.get("/:mediaType/:date/:fileName", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { date, mediaType, fileName } = req.params;
    res.status(200).sendFile(await objects_1.fileService.getPath({ date, mediaType, fileName }));
}));
