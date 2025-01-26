"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouterDef = exports.authRouterWs = void 0;
const objects_1 = require("../../../common/constants/objects");
const authController_1 = require("./authController");
const authRouterDef = (mainPath) => {
    exports.authRouterWs = objects_1.ws.of(`${mainPath}/auth`);
    exports.authRouterWs.on("connection", (socket) => {
        // Respond to a custom event from the client
        console.log("User On Auth Ws...");
        socket.on("request", async (body) => {
            // socket.emit("response", `Server says: ${body}`);
            try {
                await (0, authController_1.authController)(socket, JSON.parse(body));
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
exports.authRouterDef = authRouterDef;
