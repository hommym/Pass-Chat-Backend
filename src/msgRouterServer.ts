import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import {server } from "./common/constants/objects";
import { wsRouter } from "./common/routers/wsRouter";
import { rabbitMq } from "./common/libs/rabitMq";
import { producer } from "./common/helpers/classes/rabMqProducer";

//ws routes
wsRouter("/ws", true);

const port = process.env.WSSERVER ? process.env.MSG_ROUTER_PORT : 5000;

const startServer = async () => {
  try {
    server.listen(port, async () => {
      await rabbitMq.connect();
      await rabbitMq.createChannel();
      await producer.init();  // registering rabbitmq producer
      console.log(`MsgRouter Websocket Server listening on port ${port}..`);
    });
  } catch (error) {
    // log to loging file
  }
};

startServer();
