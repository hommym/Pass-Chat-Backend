"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumer = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rabitMq_1 = require("../../libs/rabitMq");
class RabitMQConsumer {
    constructor(qName) {
        this.init = async () => {
            await rabitMq_1.rabbitMq.ch.consume(this.qName, async (msg) => {
                console.log(`Consuming data from ${this.qName} queue...`);
                // code for processing consumed data
                console.log("Data consumed");
            });
        };
        if (!qName)
            throw new Error("No Value provided for CROSSMSGROUTERNAME env");
        this.qName = qName;
    }
}
exports.consumer = new RabitMQConsumer(process.env.CROSS_MSG_ROUTER_QNAME);
