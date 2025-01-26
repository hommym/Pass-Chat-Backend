"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compiledHtml = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const compiledHtml = async (templateName, injectables) => {
    const templatePath = (0, path_1.join)(__dirname, `/templates/${templateName}.html`);
    let htmlFile = await (0, promises_1.readFile)(templatePath, "utf-8");
    Object.keys(injectables).forEach((key) => {
        const placeholder = `{{${key}}}`;
        htmlFile = htmlFile.replace(new RegExp(placeholder, "g"), injectables[key]);
    });
    return htmlFile;
};
exports.compiledHtml = compiledHtml;
