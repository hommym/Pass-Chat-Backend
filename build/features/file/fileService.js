"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const path_1 = require("path");
const path_2 = require("../../common/helpers/path");
const promises_1 = require("fs/promises");
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
}
exports.FileService = FileService;
