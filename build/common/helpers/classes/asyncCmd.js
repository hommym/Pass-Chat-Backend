"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execAsync = void 0;
const child_process_1 = require("child_process");
const execAsync = (command) => {
    // this method is for executing cmd commands in an asynchronous manner
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            }
            else
                resolve(stdout);
        });
    });
};
exports.execAsync = execAsync;
