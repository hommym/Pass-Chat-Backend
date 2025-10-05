"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsRouter = void 0;
const chatHandler_1 = require("../../features/chat/ws/chatHandler");
const chatNotificationHandler_1 = require("../../features/notification/ws/chatNotificationHandler");
const authHandler_1 = require("../../features/auth/ws/authHandler");
const crossMsgRouterHandler_1 = require("../../sys_features/cross_msg/ws/crossMsgRouterHandler");
const wsRouter = (mainPath, isSystem = false) => {
    if (isSystem) {
        (0, crossMsgRouterHandler_1.crossServerMsgDef)(mainPath);
    }
    else {
        (0, chatHandler_1.chatRouterDef)(mainPath);
        (0, chatNotificationHandler_1.notificationRouterDef)(mainPath);
        (0, authHandler_1.authRouterDef)(mainPath);
    }
};
exports.wsRouter = wsRouter;
