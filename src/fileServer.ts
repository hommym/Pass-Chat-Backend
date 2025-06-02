import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { fileRouter } from "./features/file/http/fileController";
import { checkDbConnection } from "./common/database/checkDbConnection";
import cors from "cors";
import { errorHandler } from "./common/middlewares/errorHandler";

const fileServer = express();


fileServer.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], credentials: true }));

fileServer.use("/api/v1", express.json({ limit: "100mb" }), fileRouter);

// error handling middlware
fileServer.use(errorHandler);
const port = process.env.FILESERVERPORT ? process.env.FILESERVERPORT : 3000;

const startServer = async () => {
  try {
    await checkDbConnection();
    fileServer.listen(port, () => {
      console.log(`File Server listening on port ${port}..`);
    });
  } catch (error) {
    // log to loging file
  }
};

startServer();
