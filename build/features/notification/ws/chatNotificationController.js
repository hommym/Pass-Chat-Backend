"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatNotificationController = void 0;
const chatNotificationWsRequestDto_1 = require("../dto/chatNotificationWsRequestDto");
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const objects_1 = require("../../../common/constants/objects");
const errorHandler_1 = require("../../../common/middlewares/errorHandler");
const chatNotificationController = async (socket, request) => {
    await (0, bodyValidator_1.bodyValidatorWs)(chatNotificationWsRequestDto_1.ChatNotificationWsRequestDto, request);
    const { action, chatType, data } = request;
    if (action === "setNotification") {
        if (!chatType || !data)
            throw new errorHandler_1.WsError("No value passed for chatType or data");
        await objects_1.chatNotificationService.setNotification(chatType, data, socket);
    }
    else {
        await objects_1.chatNotificationService.getNotification(socket);
    }
};
exports.chatNotificationController = chatNotificationController;
