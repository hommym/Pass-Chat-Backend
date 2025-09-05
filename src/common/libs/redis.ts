import dotenv from "dotenv";
dotenv.config();
import { createClient, createClientPool, RedisClientPoolType, RedisFunctions, RedisModules, RedisScripts, RespVersions } from "redis";

class RedisClient {
  private pool?: RedisClientPoolType<RedisModules, RedisFunctions, RedisScripts, RespVersions, {}>;

  public connect = async () => {
    if (process.env.REDIS_URL) new Error("Redis Error:No REDIS_URL env provided");
    const redisPool = createClientPool({ url: process.env.REDIS_URL}).on("error", (err) => {
      console.log(`RedisError:${err}`);
    });
    console.log("Connecting to Redis-Server..")
    this.pool = await redisPool.connect();
    console.log("Redis-Server Ready");
  };

  public get client() {
    if (this.pool && this.pool.isOpen) return this.pool;
    else throw new Error("Redis Server Error");
  }

  // add a method for geting raw clients from the pool(Add if needed)

}

export const redis = new RedisClient();
