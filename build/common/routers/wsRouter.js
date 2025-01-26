"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsRouter = void 0;
const chatHandler_1 = require("../../features/chat/ws/chatHandler");
const chatNotificationHandler_1 = require("../../features/notification/ws/chatNotificationHandler");
const authHandler_1 = require("../../features/auth/ws/authHandler");
const wsRouter = (mainPath) => {
    (0, chatHandler_1.chatRouterDef)(mainPath);
    (0, chatNotificationHandler_1.notificationRouterDef)(mainPath);
    (0, authHandler_1.authRouterDef)(mainPath);
};
exports.wsRouter = wsRouter;
