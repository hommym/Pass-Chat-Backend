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

  private get client() {
    if (this.pool && this.pool.isOpen) return this.pool;
    else throw new Error("Redis Server Error");
  }

  public cacheData=async (key:string,value:string)=>{
   await this.client.set(key, value, { expiration: { type: "EX", value: 86400 } });
  }

  public getCachedData= async (key:string)=>{
    return await this.client.get(key);
  }

  public removeCachedData= async (key:string)=>{
    await this.client.del(key); // 1 if removed, 0 if key didn't exist
  }

  // add a method for geting raw clients from the pool(Add if needed)

}

export const redis = new RedisClient();
