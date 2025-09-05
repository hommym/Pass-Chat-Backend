import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { app, appEvents, server } from "./common/constants/objects";
import { checkDbConnection } from "./common/database/checkDbConnection";
import { wsRouter } from "./common/routers/wsRouter";
import { redis } from "./common/libs/redis";


//ws routes
wsRouter("/ws");

const port = process.env.WSSERVER ? process.env.WSSERVER : 4000;

const startServer = async () => {
  try {
    await checkDbConnection();
    appEvents.setUpAllListners();
    await redis.connect();
    server.listen(port, () => {
      console.log(`Websocket Server listening on port ${port}..`);
    });
  } catch (error) {
    // log to loging file
  }
};

startServer();
