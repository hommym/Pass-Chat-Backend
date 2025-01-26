"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadValidator = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("./errorHandler");
const path_1 = require("path");
const path_2 = require("../helpers/path");
const promises_1 = require("fs/promises");
const videoMimeTypes = ["video/mp4", "video/x-matroska", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg"];
const audioMimeTypes = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg", "audio/aac", "audio/flac", "audio/x-m4a"];
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp", "image/svg+xml", "image/x-icon"];
const documentMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
];
exports.fileUploadValidator = (0, express_async_handler_1.default)(async (req, res, next) => {
    const metaData = req.headers["upload-metadata"];
    if (!metaData)
        throw new errorHandler_1.AppError("No Data passed for header upload-metadata", 400);
    const filesInfo = metaData.split(",");
    const basePath = (0, path_1.join)(__dirname, "..", "..", "..", `/storage`);
    let fullPath = "";
    let fileName;
    let fileType;
    let date;
    for (const data of filesInfo) {
        const list = data.trim().split(" ");
        if (list[0] === "filename") {
            // check if the file is in the right format
            fileName = Buffer.from(list[1], "base64").toString("utf-8");
        }
        else if (list[0] === "filetype") {
            fileType = Buffer.from(list[1], "base64").toString("utf-8");
        }
        else if (list[0] === "date") {
            // check if date is in the right format
            date = Buffer.from(list[1], "base64").toString("utf-8");
            ;
        }
        else {
            throw new errorHandler_1.AppError("upload-metadata header properties should either be filetype or filename or date", 400);
        }
    }
    // check file type to know the folder to save the file
    if (imageMimeTypes.includes(fileType)) {
        fullPath = (0, path_1.join)(basePath, `/images/${date}`);
        if (!(await (0, path_2.checkPathExists)(fullPath))) {
            await (0, promises_1.mkdir)(fullPath, { recursive: true });
        }
        //Check file with the name exist
        fullPath = (0, path_1.join)(fullPath, `/${fileName}`);
        if (await (0, path_2.checkPathExists)(fullPath)) {
            throw new errorHandler_1.AppError(`A file with this name exist`, 404);
        }
    }
    else if (videoMimeTypes.includes(fileType)) {
        fullPath = (0, path_1.join)(basePath, `/videos/${date}`);
        if (!(await (0, path_2.checkPathExists)(fullPath))) {
            await (0, promises_1.mkdir)(fullPath, { recursive: true });
        }
        //Check file with the name exist
        // fullPath = join(fullPath, `/${fileName!}`);
        // if (await checkPathExists(fullPath)) {
        //   throw new AppError(`A file with this name exist`, 404);
        // }
    }
    else if (audioMimeTypes.includes(fileType)) {
        fullPath = (0, path_1.join)(basePath, `/audios/${date}`);
        if (!(await (0, path_2.checkPathExists)(fullPath))) {
            await (0, promises_1.mkdir)(fullPath, { recursive: true });
        }
        //Check file with the name exist
        fullPath = (0, path_1.join)(fullPath, `/${fileName}`);
        if (await (0, path_2.checkPathExists)(fullPath)) {
            throw new errorHandler_1.AppError(`A file with this name exist`, 404);
        }
    }
    else if (documentMimeTypes.includes(fileType)) {
        fullPath = (0, path_1.join)(basePath, `/docs/${date}`);
        if (!(await (0, path_2.checkPathExists)(fullPath))) {
            await (0, promises_1.mkdir)(fullPath, { recursive: true });
        }
        //Check file with the name exist
        fullPath = (0, path_1.join)(fullPath, `/${fileName}`);
        if (await (0, path_2.checkPathExists)(fullPath)) {
            throw new errorHandler_1.AppError(`A file with this name exist`, 404);
        }
    }
    else {
        throw new errorHandler_1.AppError("The uploaded file is not supported", 400);
    }
    req.body.fullPath = fullPath;
    next();
});
