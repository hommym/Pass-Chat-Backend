import { Namespace } from "socket.io";
import { SocketV1 } from "../../../common/helpers/classes/socketV1";
import { ws } from "../../../common/constants/objects";
import { cMRService } from "../../crossMsgRouterService";


export let crossServerMsgRouterWs: Namespace;

export const crossServerMsgDef = (mainPath: string) => {
  crossServerMsgRouterWs = ws.of(`${mainPath}/cross-msg-router`);

  //   crossServerMsgRouterWs.use(verifyJwtForWs);
  crossServerMsgRouterWs.on("connection", (socket) => {
    // Respond to a custom event from the client
    console.log("Server Connecting to cross server message router..");
    socket.on("request", async (body) => {
      try {
        cMRService.publishMessage(body);
      } catch (error: any) {
        // console.log(`error:${error}`);
        socket.emit("error", { message: error.message });
      }
    });
    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`Server has disconnected, socketId=${socket.id}`);
    });
  });
};
