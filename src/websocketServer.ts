import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { app, appEvents, server } from "./common/constants/objects";
import { checkDbConnection } from "./common/database/checkDbConnection";
import { wsRouter } from "./common/routers/wsRouter";
import { redis } from "./common/libs/redis";
import { consumer } from "./common/helpers/classes/rabMqConsumer";
import { crossMsgRouter } from "./common/libs/wsClient";
import { rabbitMq } from "./common/libs/rabitMq";


//ws routes
wsRouter("/ws");

const port = process.env.WSSERVER ? process.env.WSSERVER : 4000;

const startServer = async () => {
  try {
    await checkDbConnection();
    appEvents.setUpAllListners();
    await redis.connect();
    await rabbitMq.connect()
    await rabbitMq.createChannel();
    await consumer.init()  // registering rabitmq consumer
    await crossMsgRouter.connect();  // connecting to cross server msg router
    server.listen(port, () => {
      console.log(`Websocket Server listening on port ${port}..`);
    });
  } catch (error) {
    // log to loging file
  }
};

startServer();
