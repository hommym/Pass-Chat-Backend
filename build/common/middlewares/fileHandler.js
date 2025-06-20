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
    const { buffer, mimetype, size } = req.file;
    const { mediaType, fileName, date } = req.body;
    const userSub = await objects_1.database.userSubscription.findMany({ where: { userId: req.body.verifiedUserId, status: "paid" }, include: { subPlan: true } });
    // check file size limit per upload and per day
    const fileLimitsData = userSub.length !== 0 ? userSub[0].subPlan.benefit : { maxFilesSizePerDay: 20, maxFilesSizePerUpload: 2 }; // sizes in gb
    //checking if file size exceed the allowed limit per upload .
    if (fileLimitsData.maxFilesSizePerUpload < size / 1073741824)
        throw new errorHandler_1.AppError(`File size exceeds the allowed limit of ${fileLimitsData.maxFilesSizePerUpload}GB`, 413);
    // check if the daily file size quota is reached(N/A)
    let dirPath = (0, path_1.join)(__dirname, "..", "..", "..", "/storage");
    dirPath = (0, path_1.join)(dirPath, `/${mediaType}s/${date}/${fileName.split(".")[0]}`);
    if (!(list_1.allowedMediaMimeTypes.includes(mimetype) || list_1.allowedDocumentMimeTypes.includes(mimetype))) {
        throw new errorHandler_1.AppError(`The file type ${mimetype} is supported`, 400);
    }
    else if (await (0, path_2.checkPathExists)(dirPath)) {
        throw new errorHandler_1.AppError("File already exist", 409);
    }
    await objects_1.fileService.saveFile(dirPath, buffer, fileName.split(".")[1]);
    if (mediaType === "video") {
        // create and save a video thumbnail
        const thumbNailPath = (0, path_1.join)(__dirname, "..", "..", "..", `/storage/images/${date}/${fileName.split(".")[0]}`);
        await objects_1.fileService.getVideoThumbNail((0, path_1.join)(dirPath, `original.${fileName.split(".")[1]}`), thumbNailPath, "original.png");
    }
    next();
});
