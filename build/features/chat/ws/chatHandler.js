"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouterDef = exports.chatRouterWs = void 0;
const objects_1 = require("../../../common/constants/objects");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const chatController_1 = require("./chatController");
const chatRouterDef = (mainPath) => {
    exports.chatRouterWs = objects_1.ws.of(`${mainPath}/chat`);
    exports.chatRouterWs.use(verifyJwt_1.verifyJwtForWs);
    exports.chatRouterWs.on("connection", (socket) => {
        // Respond to a custom event from the client
        console.log("User On Chat Ws...");
        socket.on("request", async (body) => {
            try {
                await (0, chatController_1.chatController)(socket, JSON.parse(body));
            }
            catch (error) {
                // console.log(`error:${error}`);
                socket.emit("error", { message: error.message });
            }
        });
        // Handle disconnection
        socket.on("disconnect", async () => {
            console.log(`User has disconnected, socketId=${socket.id}`);
            await objects_1.chatService.setUserOnlineStatus("offline", null, socket.id, socket.isWebUser);
            await objects_1.chatService.handleUserDisconnection(socket.authUserId);
            objects_1.appEvents.emit("alert-contacts-user-online-status", socket.authUserId);
        });
    });
};
exports.chatRouterDef = chatRouterDef;
