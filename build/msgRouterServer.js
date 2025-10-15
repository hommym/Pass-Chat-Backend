"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const objects_1 = require("./common/constants/objects");
const wsRouter_1 = require("./common/routers/wsRouter");
const rabitMq_1 = require("./common/libs/rabitMq");
const rabMqProducer_1 = require("./common/helpers/classes/rabMqProducer");
//ws routes
(0, wsRouter_1.wsRouter)("/ws", true);
const port = process.env.WSSERVER ? process.env.MSG_ROUTER_PORT : 5000;
const startServer = async () => {
    try {
        objects_1.server.listen(port, async () => {
            await rabitMq_1.rabbitMq.connect();
            await rabitMq_1.rabbitMq.createChannel();
            await rabMqProducer_1.producer.init(); // registering rabbitmq producer
            console.log(`MsgRouter Websocket Server listening on port ${port}..`);
        });
    }
    catch (error) {
        // log to loging file
    }
};
startServer();
