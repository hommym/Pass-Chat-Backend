"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatNotificationService = void 0;
const bodyValidator_1 = require("../../common/middlewares/bodyValidator");
const privateChatNotficationDto_1 = require("./dto/privateChatNotficationDto");
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
class ChatNotificationService {
    async saveNotification(messageId, recipientId, platform = "mobile", action = "updateMessage") {
        await objects_1.database.notification.upsert({
            where: { userId_messageId_platform: { userId: recipientId, messageId, platform } },
            create: { userId: recipientId, messageId, platform, action },
            update: { action },
        });
    }
    async setNotification(chatType, data) {
        if (chatType === "private") {
            await (0, bodyValidator_1.bodyValidatorWs)(privateChatNotficationDto_1.PrivateChatNotificationDto, data);
            const { messageAction, messageId, recipientId } = data;
            const message = await objects_1.database.message.findUnique({ where: { id: messageId } });
            if (!message)
                throw new errorHandler_1.WsError("No message with this id exist");
            else if (messageAction === "read") {
                await objects_1.database.message.update({ where: { id: messageId }, data: { read: true } });
            }
            else {
                await objects_1.database.message.update({ where: { id: messageId }, data: { recieved: true } });
            }
            await this.saveNotification(messageId, recipientId);
        }
        else if (chatType === "channel") {
            // N/A
        }
        else {
            // group
            // N/A
        }
    }
    async getNotification(socket) {
        const userId = socket.authUserId;
        const messages = [];
        const notificationIds = [];
        // get those notfications and then delete them
        (await objects_1.database.notification.findMany({ where: { userId, platform: "mobile", messageId: { not: null }, action: { not: null } }, include: { message: true } })).forEach((notification) => {
            messages.push({ messages: notification.message, action: notification.action });
            notificationIds.push(notification.id);
        });
        console.log(messages);
        socket.emit("response", { action: "getNotification", data: messages });
        await objects_1.database.notification.deleteMany({ where: { id: { in: notificationIds } } });
    }
}
exports.ChatNotificationService = ChatNotificationService;
