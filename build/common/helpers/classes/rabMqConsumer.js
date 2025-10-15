"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumer = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rabitMq_1 = require("../../libs/rabitMq");
const redis_1 = require("../../libs/redis");
const chatHandler_1 = require("../../../features/chat/ws/chatHandler");
class RabitMQConsumer {
    constructor(qName) {
        this.port = process.env.WSSERVERPORT;
        this.sendData = async (account, wsEventName, data) => {
            const connectionIds = [account.connectionId, account.webConnectionId];
            const platformStatuses = [account.onlineStatus, account.onlineStatusWeb];
            for (let i = 0; i < connectionIds.length; i++) {
                if (platformStatuses[i] !== "offline") {
                    const userConnection = chatHandler_1.chatRouterWs.sockets.get(connectionIds[i]);
                    if (userConnection) {
                        console.log(`Emmiting data with evenName:${wsEventName} and data:${data}`);
                        userConnection.emit(wsEventName, data);
                        continue;
                    }
                    else {
                        // component for resending when  user is back online
                    }
                }
            }
        };
        this.init = async () => {
            await rabitMq_1.rabbitMq.ch.consume(this.qName, async (msg) => {
                // console.log(`Consuming data from ${this.qName} queue...`);
                // code for processing consumed data(N/a)
                const producerData = JSON.parse(msg.content.toString());
                const _a = producerData.data, { recipientId } = _a, dataToSend = __rest(_a, ["recipientId"]);
                const cache = await redis_1.redis.getCachedData(`${this.port}:${recipientId}`);
                const account = cache ? JSON.parse(cache) : null;
                if (account) {
                    await this.sendData(account, producerData.wsEventName, dataToSend);
                    // send rabbit mq ack
                    rabitMq_1.rabbitMq.ch.ack(msg);
                }
                console.log("Data consumed");
            });
        };
        if (!qName)
            throw new Error("No Value provided for CROSSMSGROUTERNAME env");
        this.qName = qName;
    }
}
exports.consumer = new RabitMQConsumer(process.env.CROSS_MSG_ROUTER_QNAME);
