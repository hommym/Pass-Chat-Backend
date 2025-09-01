import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { app, appEvents, server } from "./common/constants/objects";
import { httpRouter } from "./common/routers/httpRouter";
import { checkDbConnection } from "./common/database/checkDbConnection";
import { errorHandler } from "./common/middlewares/errorHandler";
import { wsRouter } from "./common/routers/wsRouter";
import cors from "cors";
import { verifyJwtForWs } from "./common/middlewares/verifyJwt";

dotenv.config();


app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], credentials: true }));





//ws routes
wsRouter("/ws");

const port = process.env.WSSERVER ? process.env.WSSERVER : 4000;

const startServer = async () => {
  try {
    await checkDbConnection();
    appEvents.setUpAllListners();
    server.listen(port, () => {
      console.log(`Websocket Server listening on port ${port}..`);
    });
  } catch (error) {
    // log to loging file
  }
};

startServer();
