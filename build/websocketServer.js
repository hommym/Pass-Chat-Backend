"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const objects_1 = require("./common/constants/objects");
const checkDbConnection_1 = require("./common/database/checkDbConnection");
const wsRouter_1 = require("./common/routers/wsRouter");
//ws routes
(0, wsRouter_1.wsRouter)("/ws");
const port = process.env.WSSERVER ? process.env.WSSERVER : 4000;
const startServer = async () => {
    try {
        await (0, checkDbConnection_1.checkDbConnection)();
        objects_1.appEvents.setUpAllListners();
        objects_1.server.listen(port, () => {
            console.log(`Websocket Server listening on port ${port}..`);
        });
    }
    catch (error) {
        // log to loging file
    }
};
startServer();
