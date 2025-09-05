"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const objects_1 = require("./common/constants/objects");
const httpRouter_1 = require("./common/routers/httpRouter");
const checkDbConnection_1 = require("./common/database/checkDbConnection");
const errorHandler_1 = require("./common/middlewares/errorHandler");
const cors_1 = __importDefault(require("cors"));
const redis_1 = require("./common/libs/redis");
dotenv_1.default.config();
// middlewares
objects_1.app.use((req, res, next) => {
    // Skip JSON parsing for a specific endpoint, e.g., /api/v1/raw
    if (req.path.startsWith("/api/v1/subscription/webhooks"))
        return next();
    express_1.default.json({ limit: "100mb" })(req, res, next);
});
objects_1.app.use((0, cors_1.default)({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], credentials: true }));
// routes
objects_1.app.use("/api/v1", httpRouter_1.httpRouter);
// error handling middlware
objects_1.app.use(errorHandler_1.errorHandler);
// ws middleware
// ws.use(verifyJwtForWs)
//ws routes
// wsRouter("/ws");
const port = process.env.PORT ? process.env.PORT : 8000;
const startServer = async () => {
    try {
        await (0, checkDbConnection_1.checkDbConnection)();
        objects_1.appEvents.setUpAllListners();
        await redis_1.redis.connect();
        objects_1.server.listen(port, () => {
            console.log(`Server listening on port ${port}..`);
        });
    }
    catch (error) {
        // log to loging file
    }
};
startServer();
