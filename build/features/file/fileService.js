"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const path_1 = require("path");
const path_2 = require("../../common/helpers/path");
const promises_1 = require("fs/promises");
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
class FileService {
    async saveFile(dirPath, file, extention) {
        // check if path dir exist
        //if no create dirs
        // if yes save file through events
        if (!(await (0, path_2.checkPathExists)(dirPath))) {
            await (0, promises_1.mkdir)(dirPath, { recursive: true });
        }
        await (0, promises_1.writeFile)((0, path_1.join)(dirPath, `/original.${extention}`), file);
        // Add file optimizations(N/A)
    }
    async getPath(detail) {
        const { date, fileName, mediaType } = detail;
        const originalFilePath = (0, path_1.join)(__dirname, "..", "..", "..", `/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/original.${fileName.split(".")[1]}`);
        const optimizeFilePath = (0, path_1.join)(__dirname, "..", "..", "..", `/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/optimize.${fileName.split(".")[1]}`);
        if (await (0, path_2.checkPathExists)(optimizeFilePath))
            return optimizeFilePath;
        return originalFilePath;
    }
    async checkRootOrCreate(ownerId) {
        let rootFolder = await objects_1.database.file.findMany({ where: { ownerId, isRoot: true } });
        if (rootFolder.length === 0) {
            // creating root folder for user
            return await objects_1.database.file.create({ data: { name: "/", ownerId, isRoot: true, type: "dir" } });
        }
        return rootFolder[0];
    }
    async checkFolderOrFile(itemId) {
        return await objects_1.database.file.findUnique({ where: { id: itemId } });
    }
    async checkFileOrFolderInDirectory(itemName, directoryId, ownerId, type) {
        return objects_1.database.file.findUnique({ where: { ownerId_parentId_name_type: { name: itemName, ownerId, parentId: directoryId, type } } });
    }
    async saveFolderOrFile(createItemDto, ownerId, type, urlToFile) {
        const { parentFolderId, name } = createItemDto;
        // setting parent folder to root folder if parentFolderId is not provided
        let parentFolder = await this.checkRootOrCreate(ownerId);
        if (parentFolderId) {
            try {
                parentFolder = await objects_1.database.file.findUnique({ where: { id: +parentFolderId, type: "dir" } });
            }
            catch (error) {
                throw new errorHandler_1.AppError("parentId should be string with an integer value", 400);
            }
            if (!parentFolder)
                throw new errorHandler_1.AppError("The Parent Folder specified does not exist", 404);
        }
        if (await this.checkFileOrFolderInDirectory(name, parentFolder.id, ownerId, type === "file" ? "norm" : "dir"))
            throw new errorHandler_1.AppError(`A ${type} with this name:${name} already exist in this location`, 409);
        return await objects_1.database.file.create({
            data: { ownerId, name, type: type === "file" ? "norm" : "dir", dataUrl: urlToFile, parentId: parentFolder.id },
            omit: { isRoot: true, ownerId: true },
        });
    }
    async getAllFilesAndFolders(ownerId) {
        return await objects_1.database.file.findMany({ where: { ownerId }, omit: { ownerId: true } });
    }
    async renameFileOrFolder(renameDto, ownerId) {
        const { itemId, newName } = renameDto;
        const item = await this.checkFolderOrFile(itemId);
        if (!item) {
            throw new errorHandler_1.AppError("Rename Failed ,item does not exist", 404);
        }
        else if (item.ownerId !== ownerId)
            throw new errorHandler_1.AppError("Rename Failed,you can only move items that belongs to you", 402);
        else if ((await this.checkFileOrFolderInDirectory(newName, item.parentId, ownerId, item.type)) && newName !== item.name)
            throw new errorHandler_1.AppError(`A ${item.type === "norm" ? "file" : "directory"} with this name:${newName} already exist in this location`, 409);
        const updatedItem = await objects_1.database.file.update({ where: { id: itemId }, data: { name: newName } });
        return { message: `Rename Successful ,oldName:${item.name} newName:${updatedItem.name}` };
    }
    async moveFileOrFolder(moveDto, ownerId) {
        const { itemId, parentFolderId } = moveDto;
        if (parentFolderId === itemId) {
            throw new errorHandler_1.AppError("Move Failed ,cannot move an item to itself", 401);
        }
        const item = await this.checkFolderOrFile(itemId);
        const parentFolder = await this.checkFolderOrFile(parentFolderId);
        if (!item || !parentFolder) {
            throw new errorHandler_1.AppError(!item ? "Move Failed , item being moved does not exist" : "Move Failed , No directory with this id exist", 404);
        }
        else if (parentFolder.type !== "dir") {
            throw new errorHandler_1.AppError("Move Failed ,No directory with this id exist ", 404);
        }
        else if (item.ownerId !== ownerId) {
            throw new errorHandler_1.AppError("Move Failed , you can only move items that belongs to you", 402);
        }
        else if ((await this.checkFileOrFolderInDirectory(item.name, parentFolderId, ownerId, item.type)) && item.parentId !== parentFolderId)
            throw new errorHandler_1.AppError(`A ${item.type === "norm" ? "file" : "directory"} with this name:${item.name} already exist in this location`, 409);
        await objects_1.database.file.update({ where: { id: itemId }, data: { parentId: parentFolderId } });
        return { mesage: "Move Successful" };
    }
    async deleteFileOrFolder(deleteItemsDto, ownerId) {
        const { itemIds } = deleteItemsDto;
        await objects_1.database.file.deleteMany({ where: { isRoot: false, id: { in: itemIds }, ownerId } });
    }
    async getVideoThumbNail(srcFilePath, finalFolderPath, filename) {
        return new Promise((resolve, reject) => {
            const timeToGetFrame = objects_1.randomData.num(1, 5);
            (0, fluent_ffmpeg_1.default)(srcFilePath)
                .screenshot({ timestamps: [`00:00:0${timeToGetFrame}`], folder: finalFolderPath, filename })
                .on("end", () => {
                resolve(undefined);
            })
                .on("error", (error) => {
                reject(error);
            });
        });
    }
}
exports.FileService = FileService;
