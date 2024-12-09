import express from "express";
import dotenv from "dotenv";
import { app, server, ws } from "./common/constants/objects";
import { httpRouter } from "./common/routers/httpRouter";
import { checkDbConnection } from "./common/database/checkDbConnection";
dotenv.config();

// middlewares
app.use(express.json());

// routes
app.use("/api/v1", httpRouter);

// error handling middlware
// app.use(errorHandler);

const port = process.env.PORT ? process.env.PORT : 8000;

const startServer = async () => {
  try {
    await checkDbConnection();
    server.listen(port, () => {
      console.log(`Server listening on port ${port}..`);
    });

    ws.on("connection", (socket) => {
      //   console.log("A user connected");

      // Respond to a custom event from the client
      socket.on("message", (msg) => {
        // console.log("Message received:", msg);

        // Send a message back to the client
        socket.emit("response", `Server says: ${msg}`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        // console.log("User disconnected");
      });
    });
  } catch (error) {
    // log to loging file
  }
};

startServer();
