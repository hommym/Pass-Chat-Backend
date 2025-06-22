"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const fileController_1 = require("./features/file/http/fileController");
const checkDbConnection_1 = require("./common/database/checkDbConnection");
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./common/middlewares/errorHandler");
const objects_1 = require("./common/constants/objects");
const fileServer = (0, express_1.default)();
fileServer.use((0, cors_1.default)({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], credentials: true }));
fileServer.use("/api/v1", express_1.default.json({ limit: "100mb" }), fileController_1.fileRouter);
// error handling middlware
fileServer.use(errorHandler_1.errorHandler);
const port = process.env.FILESERVERPORT ? process.env.FILESERVERPORT : 3000;
const startServer = async () => {
    try {
        await (0, checkDbConnection_1.checkDbConnection)();
        objects_1.appEvents.setUpAllListners(true);
        fileServer.listen(port, () => {
            console.log(`File Server listening on port ${port}..`);
        });
    }
    catch (error) {
        // log to loging file
    }
};
startServer();
