"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFileToStorage = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const copyFileToStorage = async (sourcePath, destinationPath) => {
    try {
        // Ensure the source file exists
        await (0, promises_1.access)(sourcePath);
        // Create the destination directory if it doesn't exist
        const destinationDir = (0, path_1.dirname)(destinationPath);
        await (0, promises_1.mkdir)(destinationDir, { recursive: true });
        // Copy the file
        await (0, promises_1.copyFile)(sourcePath, destinationPath);
        console.log(`File copied from ${sourcePath} to ${destinationPath}`);
    }
    catch (error) {
        console.error(`Error copying file:`, error);
        throw error;
    }
};
exports.copyFileToStorage = copyFileToStorage;
