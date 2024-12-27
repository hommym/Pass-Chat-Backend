import { Namespace } from "socket.io";
import { ws } from "../../../common/constants/objects";
import { authController } from "./authController";

export let authRouterWs: Namespace;

export const authRouterDef = (mainPath: string) => {
  authRouterWs = ws.of(`${mainPath}/auth`);
  authRouterWs.on("connection", (socket) => {
    // Respond to a custom event from the client
    console.log("User On Auth Ws...");
    socket.on("request", async (body) => {
      // socket.emit("response", `Server says: ${body}`);
      try {
        await authController(socket, JSON.parse(body));
      } catch (error: any) {
        socket.emit("error", { message: error.message });
      }
    });
    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User has disconnected, socketId=${socket.id}`);
    });
  });
};
