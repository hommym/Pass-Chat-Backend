"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouterDef = exports.notificationRouterWs = void 0;
const objects_1 = require("../../../common/constants/objects");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const chatNotificationController_1 = require("./chatNotificationController");
const notificationRouterDef = (mainPath) => {
    exports.notificationRouterWs = objects_1.ws.of(`${mainPath}/notification`);
    exports.notificationRouterWs.use(verifyJwt_1.verifyJwtForWs);
    exports.notificationRouterWs.on("connection", (socket) => {
        // Respond to a custom event from the client
        console.log("User On Chat-Notification Ws...");
        socket.on("request", async (body) => {
            try {
                await (0, chatNotificationController_1.chatNotificationController)(socket, JSON.parse(body));
            }
            catch (error) {
                socket.emit("error", { message: error.message });
            }
        });
        // Handle disconnection
        socket.on("disconnect", async () => {
            console.log(`User has disconnected, socketId=${socket.id}`);
        });
    });
};
exports.notificationRouterDef = notificationRouterDef;
