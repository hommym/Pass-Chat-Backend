"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crossServerMsgDef = exports.crossServerMsgRouterWs = void 0;
const objects_1 = require("../../../common/constants/objects");
const crossMsgRouterService_1 = require("../../crossMsgRouterService");
const crossServerMsgDef = (mainPath) => {
    exports.crossServerMsgRouterWs = objects_1.ws.of(`${mainPath}/cross-msg-router`);
    //   crossServerMsgRouterWs.use(verifyJwtForWs);
    exports.crossServerMsgRouterWs.on("connection", (socket) => {
        // Respond to a custom event from the client
        console.log("Server Connecting to cross server message router..");
        socket.on("request", async (body) => {
            try {
                crossMsgRouterService_1.cMRService.publishMessage(body);
            }
            catch (error) {
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
exports.crossServerMsgDef = crossServerMsgDef;
