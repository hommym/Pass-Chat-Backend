"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatNotificationService = void 0;
const bodyValidator_1 = require("../../common/middlewares/bodyValidator");
const privateChatNotficationDto_1 = require("./dto/privateChatNotficationDto");
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const communityChatNotificationsDto_1 = require("./dto/communityChatNotificationsDto");
class ChatNotificationService {
    async saveNotification(messageId, recipientId, platform = "mobile", action = "updateMessage") {
        // this is for setting messages notifications
        await objects_1.database.notification.upsert({
            where: { userId_messageId_platform: { userId: recipientId, messageId, platform } },
            create: { userId: recipientId, messageId, platform, action },
            update: { action },
        });
    }
    async saveCommunityNotifications(args) {
        // this a method for setting notifications for all members of a community
        const { action, communityId, membersIds, messageId, platform } = args;
        await Promise.all(membersIds.map(async (memberId) => {
            await objects_1.database.notification.upsert({
                where: { userId_communityId_platform: { userId: memberId, communityId, platform } },
                create: { userId: memberId, communityId, platform, action, type: "community", messageId },
                update: { action },
            });
        }));
    }
    async setNotification(chatType, data) {
        if (chatType === "private") {
            await (0, bodyValidator_1.bodyValidatorWs)(privateChatNotficationDto_1.PrivateChatNotificationDto, data);
            const { messageAction, messageId, recipientId, reaction } = data;
            const message = await objects_1.database.message.findUnique({ where: { id: messageId } });
            if (!message)
                throw new errorHandler_1.WsError("No message with this id exist");
            else if (messageAction === "read") {
                await objects_1.database.message.update({ where: { id: messageId }, data: { read: true } });
            }
            else if (messageAction === "reaction") {
                if (!reaction)
                    throw new errorHandler_1.WsError("No Value passed for reaction");
                await objects_1.database.message.update({ where: { id: messageId }, data: { reactions: message.reactions ? message.reactions.push(reaction) : undefined } });
            }
            else {
                await objects_1.database.message.update({ where: { id: messageId }, data: { recieved: true } });
            }
            await this.saveNotification(messageId, recipientId);
        }
        else {
            // group or channel
            await (0, bodyValidator_1.bodyValidatorWs)(communityChatNotificationsDto_1.CommunityChatNotificationDto, data);
            const { communityId, messageAction, messageId, reaction, comment } = data;
            const message = await objects_1.database.message.findUnique({ where: { id: messageId, communityId } });
            const communityMembers = await objects_1.database.communityMember.findMany({ where: { communityId } });
            if (!message)
                throw new errorHandler_1.WsError(`No message with this id exist in this ${chatType}`);
            else if (messageAction === "read") {
                await objects_1.database.message.update({ where: { id: messageId }, data: { views: { increment: 1 }, recieved: true } });
            }
            else if (messageAction === "comment") {
                if (!comment)
                    throw new errorHandler_1.WsError("No Value passed for comment");
                let comments = message.reactions ? message.reactions : [comment];
                if (comments.length >= 1) {
                    comments.push(comment);
                }
                await objects_1.database.message.update({ where: { id: messageId }, data: { comments } });
            }
            else {
                if (!reaction)
                    throw new errorHandler_1.WsError("No Value passed for reaction");
                let reactions = message.reactions ? message.reactions : [reaction];
                if (reactions.length >= 1) {
                    reactions.push(reaction);
                }
                await objects_1.database.message.update({ where: { id: messageId }, data: { reactions } });
            }
            const membersIds = communityMembers.map((member) => member.userId);
            objects_1.appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, messageId, platform: "mobile" });
        }
    }
    async getNotification(socket) {
        const userId = socket.authUserId;
        const messages = [];
        const notificationIds = [];
        // get those notfications and then delete them
        (await objects_1.database.notification.findMany({
            where: {
                OR: [
                    { userId, platform: "mobile", messageId: { not: null }, action: { not: null } },
                    { userId, platform: "mobile", action: { not: null }, communityId: { not: null } },
                    { userId, platform: "mobile", action: "phoneChange" },
                    { userId, platform: "mobile", action: "showOtpCode" },
                ],
            },
            include: { message: true },
        })).forEach((notification) => {
            const dataToSend = notification.data.otpCode
                ? {
                    messages: notification.message,
                    action: notification.action,
                    communityId: notification.communityId,
                    phones: null,
                    otpCode: notification.data.otpCode,
                }
                : {
                    messages: notification.message,
                    action: notification.action,
                    communityId: notification.communityId,
                    phones: notification.data,
                    otpCode: null,
                };
            messages.push(dataToSend);
            notificationIds.push(notification.id);
        });
        // console.log(messages);
        socket.emit("response", { action: "getNotification", data: messages });
        await objects_1.database.notification.deleteMany({ where: { id: { in: notificationIds } } });
    }
}
exports.ChatNotificationService = ChatNotificationService;
