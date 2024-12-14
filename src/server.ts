import express from "express";
import dotenv from "dotenv";
import { app, appEvents, server, ws } from "./common/constants/objects";
import { httpRouter } from "./common/routers/httpRouter";
import { checkDbConnection } from "./common/database/checkDbConnection";
import { errorHandler } from "./common/middlewares/errorHandler";
import { wsRouter } from "./common/routers/wsRouter";
import cors from "cors";
import { verifyJwtForWs } from "./common/middlewares/verifyJwt";
dotenv.config();

// middlewares
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

// routes
app.use("/api/v1", httpRouter);

// error handling middlware
app.use(errorHandler);


// ws middleware
// ws.use(verifyJwtForWs)

//ws routes
wsRouter("/ws");

const port = process.env.PORT ? process.env.PORT : 8000;

const startServer = async () => {
  try {
    await checkDbConnection();
    appEvents.setUpAllListners();
    server.listen(port, () => {
      console.log(`Server listening on port ${port}..`);
    });

  } catch (error) {
    // log to loging file
  }
};

startServer();
