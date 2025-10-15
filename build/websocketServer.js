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
const redis_1 = require("./common/libs/redis");
const rabMqConsumer_1 = require("./common/helpers/classes/rabMqConsumer");
const wsClient_1 = require("./common/libs/wsClient");
const rabitMq_1 = require("./common/libs/rabitMq");
//ws routes
(0, wsRouter_1.wsRouter)("/ws");
const port = process.env.WSSERVERPORT ? process.env.WSSERVERPORT : 4000;
const startServer = async () => {
    try {
        await (0, checkDbConnection_1.checkDbConnection)();
        objects_1.appEvents.setUpAllListners();
        await redis_1.redis.connect();
        await rabitMq_1.rabbitMq.connect();
        await rabitMq_1.rabbitMq.createChannel();
        await rabMqConsumer_1.consumer.init(); // registering rabitmq consumer
        await wsClient_1.msgRouter.connect(); // connecting to cross server msg router
        objects_1.server.listen(port, () => {
            console.log(`Websocket Server listening on port ${port}..`);
        });
    }
    catch (error) {
        // log to loging file
    }
};
startServer();
