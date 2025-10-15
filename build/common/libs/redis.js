"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redis_1 = require("redis");
class RedisClient {
    constructor() {
        this.connect = async () => {
            if (process.env.REDIS_URL)
                new Error("Redis Error:No REDIS_URL env provided");
            const redisPool = (0, redis_1.createClientPool)({ url: process.env.REDIS_URL }).on("error", (err) => {
                console.log(`RedisError:${err}`);
            });
            console.log("Connecting to Redis-Server..");
            this.pool = await redisPool.connect();
            console.log("Redis-Server Ready");
        };
        this.cacheData = async (key, value) => {
            await this.client.set(key, value, { expiration: { type: "EX", value: 86400 } });
        };
        this.getCachedData = async (key) => {
            return await this.client.get(key);
        };
        this.removeCachedData = async (key) => {
            await this.client.del(key); // 1 if removed, 0 if key didn't exist
        };
        // add a method for geting raw clients from the pool(Add if needed)
    }
    get client() {
        if (this.pool && this.pool.isOpen)
            return this.pool;
        else
            throw new Error("Redis Server Error");
    }
}
exports.redis = new RedisClient();
