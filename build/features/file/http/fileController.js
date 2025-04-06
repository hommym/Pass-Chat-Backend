"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
const saveFileInFolderDto_1 = require("../dtos/saveFileInFolderDto");
const createFolderDto_1 = require("../dtos/createFolderDto");
const renameFileOrFolderDto_1 = require("../dtos/renameFileOrFolderDto");
const moveFileOrFolderDto_1 = require("../dtos/moveFileOrFolderDto");
const deleteFilesOrFoldersDto_1 = require("../dtos/deleteFilesOrFoldersDto");
exports.fileRouter = (0, express_1.Router)();
exports.fileRouter.post("/upload", (0, multer_1.getFile)("file"), verifyJwt_1.verifyJwt, (0, bodyValidator_1.bodyValidator)(uploadFileDto_1.UploadFileDto), fileHandler_1.fileHandler, (0, express_async_handler_1.default)(async (req, res) => {
    const { date, mediaType, fileName } = req.body;
    res.status(201).json({ link: `${process.env.BackendUrl}/file/${mediaType}/${date}/${fileName}` });
}));
exports.fileRouter.get("/:mediaType/:date/:fileName", (0, express_async_handler_1.default)(async (req, res) => {
    const { date, mediaType, fileName } = req.params;
    res.status(200).sendFile(await objects_1.fileService.getPath({ date, mediaType, fileName }));
}));
exports.fileRouter.post("/save", (0, multer_1.getFile)("file"), (0, bodyValidator_1.bodyValidator)(saveFileInFolderDto_1.SaveFileInFolderDto), verifyJwt_1.verifyJwt, fileHandler_1.fileHandler, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, saveFileDto = __rest(_a, ["verifiedUserId"]);
    const { date, mediaType, fileName } = saveFileDto;
    const url = `${process.env.BackendUrl}/file/${mediaType}/${date}/${fileName}`;
    res.status(201).json(await objects_1.fileService.saveFolderOrFile(saveFileDto, verifiedUserId, "file", url));
}));
exports.fileRouter.post("/directory/save", (0, bodyValidator_1.bodyValidator)(createFolderDto_1.CreateFolderDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, saveFolderDto = __rest(_a, ["verifiedUserId"]);
    res.status(201).json(await objects_1.fileService.saveFolderOrFile(saveFolderDto, verifiedUserId, "directory", null));
}));
exports.fileRouter.get("/all", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { verifiedUserId } = req.body;
    res.status(200).json(await objects_1.fileService.getAllFilesAndFolders(verifiedUserId));
}));
exports.fileRouter.put("/rename", (0, bodyValidator_1.bodyValidator)(renameFileOrFolderDto_1.RenameFileOrFolderDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, renameDto = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.fileService.renameFileOrFolder(renameDto, verifiedUserId));
}));
exports.fileRouter.put("/move", (0, bodyValidator_1.bodyValidator)(moveFileOrFolderDto_1.MoveFileOrFolderDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, moveDto = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.fileService.moveFileOrFolder(moveDto, verifiedUserId));
}));
exports.fileRouter.delete("/", (0, bodyValidator_1.bodyValidator)(deleteFilesOrFoldersDto_1.DeleteFileOrFolderDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, deleteDto = __rest(_a, ["verifiedUserId"]);
    await objects_1.fileService.deleteFileOrFolder(deleteDto, verifiedUserId);
    res.status(204).end();
}));
