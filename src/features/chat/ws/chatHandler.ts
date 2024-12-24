import { Namespace } from "socket.io";
import { chatService, ws } from "../../../common/constants/objects";
import { verifyJwtForWs } from "../../../common/middlewares/verifyJwt";
import { chatController } from "./chatController";

export let chatRouterWs: Namespace;

export const chatRouterDef = (mainPath: string) => {
  chatRouterWs = ws.of(`${mainPath}/chat`);

  chatRouterWs.use(verifyJwtForWs);
  chatRouterWs.on("connection", (socket) => {
    // Respond to a custom event from the client
    console.log("User On Chat Ws...");
    socket.on("request", async (body) => {
      // socket.emit("response", `Server says: ${body}`);
      await chatController(socket, JSON.parse(body));
    });
    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User has disconnected, socketId=${socket.id}`);
      await chatService.setUserOnlineStatus("offline", null, socket.id);
    });
  });
};
