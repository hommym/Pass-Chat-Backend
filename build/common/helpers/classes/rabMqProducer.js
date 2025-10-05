"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.producer = void 0;
const rabitMq_1 = require("../../libs/rabitMq");
class RabitMQProducer {
    constructor(qName) {
        this.init = async () => {
            await rabitMq_1.rabbitMq.ch.assertQueue(this.qName, { durable: true });
        };
        this.publish = (data) => {
            console.log(`Publishing Data to ${this.qName} queue..`);
            const isP = rabitMq_1.rabbitMq.ch.sendToQueue(this.qName, Buffer.from(data), { persistent: true });
            if (isP)
                console.log(`Data published sucessfully to ${this.qName}`);
        };
        if (!qName)
            throw new Error("No Value provided for CROSSMSGROUTERNAME env");
        this.qName = qName;
    }
}
exports.producer = new RabitMQProducer(process.env.CROSS_MSG_ROUTER_QNAME);
