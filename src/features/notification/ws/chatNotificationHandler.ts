import { Namespace } from "socket.io";
import { ws } from "../../../common/constants/objects";
import { verifyJwtForWs } from "../../../common/middlewares/verifyJwt";
import { chatNotificationController } from "./chatNotificationController";



export let notificationRouterWs:Namespace;


export const notificationRouterDef = (mainPath: string) => {
    notificationRouterWs=  ws.of(`${mainPath}/notification`);
      notificationRouterWs.use(verifyJwtForWs);
      notificationRouterWs.on("connection", (socket) => {
        // Respond to a custom event from the client
        console.log("User On Chat-Notification Ws...");
        socket.on("request", async (body) => {
          try {
            await chatNotificationController(socket, JSON.parse(body));
          } catch (error:any) {
            socket.emit("error", { message: error.message });
          }
        });
        // Handle disconnection
        socket.on("disconnect", async () => {
          console.log(`User has disconnected, socketId=${socket.id}`);
        });
      });
};
