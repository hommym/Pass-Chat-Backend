"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentTaskExec = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const systeminformation_1 = __importDefault(require("systeminformation"));
class ConcurrentTaskExec {
    constructor(asyncTask) {
        this.maxConcurrentTask = process.env.MaxConcurrentTask ? +process.env.MaxConcurrentTask : 100000;
        this.minConcurrentTask = process.env.MinConcurrentTask ? +process.env.MinConcurrentTask : 10000;
        this.asyncTask = asyncTask;
    }
    async getSystemLoad() {
        const cpuUsed = (await systeminformation_1.default.currentLoad()).currentLoad / 100; // value between 0 and 1
        const memoryInfo = await systeminformation_1.default.mem();
        const memoryUsed = (memoryInfo.active / memoryInfo.total) * 1; // value between 0 and 1
        // console.log(`Cpu%Used=${cpuUsed * 100} , Memory%Used=${memoryUsed * 100}`);
        // calculate the whole system's load
        return cpuUsed * 0.6 + memoryUsed * 0.4; // Value btw 0 and 1
    }
    async getNumConcurrentTasks() {
        // this method will get you the number of cocurrent task you can run base current system load
        const systemLoad = await this.getSystemLoad();
        // console.log(`SystemLoad=${systemLoad}`);
        return this.maxConcurrentTask - systemLoad * (this.maxConcurrentTask - this.minConcurrentTask);
    }
    async executeTasks() {
        const allowedNumConcurrentTasks = Math.round(await this.getNumConcurrentTasks());
        // console.log(`allowedConc=${allowedNumConcurrentTasks} , asyncTask=${this.asyncTask.length}\n`);
        if (allowedNumConcurrentTasks > this.asyncTask.length) {
            return await Promise.all(this.asyncTask);
        }
        else {
            let results = [];
            for (let i = 0; i < this.asyncTask.length; i += allowedNumConcurrentTasks) {
                const asyncTaskToBeExec = this.asyncTask.slice(i, i + allowedNumConcurrentTasks);
                if (results.length === 0) {
                    results = await Promise.all(asyncTaskToBeExec);
                }
                else {
                    results = [...results, ...(await Promise.all(asyncTaskToBeExec))];
                }
            }
            return results;
        }
    }
}
exports.ConcurrentTaskExec = ConcurrentTaskExec;
