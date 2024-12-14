import { Namespace } from "socket.io";
import { chatService, ws } from "../../../common/constants/objects";
import { verifyJwtForWs } from "../../../common/middlewares/verifyJwt";

export let chatRouter: Namespace;

export const chatRouterDef = (mainPath: string) => {
  chatRouter = ws.of(`${mainPath}/chat`);

  chatRouter.use(verifyJwtForWs);
  chatRouter.on("connection", (socket) => {
    // Respond to a custom event from the client
    console.log("User On Chat Ws...");
    socket.on("request", (body) => {
      // socket.emit("response", `Server says: ${body}`);
      // define chatActions Router
    });
    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log("User has disconnected");
      await chatService.setUserOnlineStatus("offline", null, socket.id);
    });
  });
};
