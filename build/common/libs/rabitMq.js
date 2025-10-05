"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitMq = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const amqplib_1 = __importDefault(require("amqplib"));
class RabbitMq {
    constructor() {
        this.connUrl = process.env.RABBITMQ_URL;
        this.connect = async () => {
            console.log("Connecting to RabitMQ...");
            this.connection = await amqplib_1.default.connect(this.connUrl);
            this.connection.on("error", (err) => {
                console.log(`RabitMQ Connection Error:${err}`);
            });
            this.connection.on("close", () => {
                console.log("RabitMq connection closed");
                this.connection = undefined;
            });
            console.log("RabitMQ Connected Successfully");
        };
        this.createChannel = async () => {
            if (!this.connection)
                throw new Error("Error Creating Channel: RabbitMQ is not connected");
            this.channel = await this.connection.createConfirmChannel();
            this.channel.on("error", (err) => {
                console.log(`RabitMQ Channel Creation Error:${err}`);
            });
            this.channel.on("close", () => {
                console.log("RabbitMQ channel closed");
                // channel closed; next operations should re-create channel (N/A)
            });
        };
        if (!this.connUrl)
            throw new Error("RabbitMq Error:No RABBITMQ_URL env provided");
    }
    get ch() {
        return this.channel;
    }
}
exports.rabbitMq = new RabbitMq();
