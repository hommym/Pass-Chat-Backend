import { Namespace } from "socket.io";
import { chatService, ws } from "../../../common/constants/objects";
import { verifyJwtForWs } from "../../../common/middlewares/verifyJwt";
import { chatController } from "./chatController";
import { SocketV1 } from "../../../common/helpers/classes/socketV1";

export let chatRouterWs: Namespace;

export const chatRouterDef = (mainPath: string) => {
  chatRouterWs = ws.of(`${mainPath}/chat`);

  chatRouterWs.use(verifyJwtForWs);
  chatRouterWs.on("connection", (socket) => {
    // Respond to a custom event from the client
    console.log("User On Chat Ws...");
    socket.on("request", async (body) => {
      // socket.emit("response", `Server says: ${body}`);
      try {
        await chatController(socket, JSON.parse(body));
      } catch (error:any) {
        socket.emit("error", { message: error.message });
      }
    });
    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User has disconnected, socketId=${socket.id}`);
      await chatService.setUserOnlineStatus("offline", null, socket.id,(socket as SocketV1).isWebUser);
    });
  });
};
