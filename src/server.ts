import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { app, appEvents, server } from "./common/constants/objects";
import { httpRouter } from "./common/routers/httpRouter";
import { checkDbConnection } from "./common/database/checkDbConnection";
import { errorHandler } from "./common/middlewares/errorHandler";
import cors from "cors";
import { redis } from "./common/libs/redis";


dotenv.config();

// middlewares
app.use((req, res, next) => {
  // Skip JSON parsing for a specific endpoint, e.g., /api/v1/raw
  if (req.path.startsWith("/api/v1/subscription/webhooks")) return next();
  express.json({ limit: "100mb" })(req, res, next);
});
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], credentials: true }));

// routes
app.use("/api/v1", httpRouter);

// error handling middlware
app.use(errorHandler);

// ws middleware
// ws.use(verifyJwtForWs)

//ws routes
// wsRouter("/ws");

const port = process.env.PORT ? process.env.PORT : 8000;

const startServer = async () => {
  try {
    await checkDbConnection();
    appEvents.setUpAllListners();
    await redis.connect()
    server.listen(port, () => {
      console.log(`Server listening on port ${port}..`);
    });
  } catch (error) {
    // log to loging file
  }
};

startServer();
