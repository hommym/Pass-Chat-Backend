"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatNotificationService = void 0;
const bodyValidator_1 = require("../../common/middlewares/bodyValidator");
const privateChatNotficationDto_1 = require("./dto/privateChatNotficationDto");
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const communityChatNotificationsDto_1 = require("./dto/communityChatNotificationsDto");
const chatHandler_1 = require("../chat/ws/chatHandler");
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
        // this a method for  updating  all members of a community about what is happening around a community(ie new messages, updated messages,deleted etc.)
        const { action, communityId, membersIds, messageId } = args;
        await Promise.all(membersIds.map(async (memberId) => {
            const userDetails = (await objects_1.database.user.findUnique({ where: { id: memberId } }));
            const connectionIds = [userDetails.connectionId, userDetails.webConnectionId];
            const platformStatuses = [userDetails.onlineStatus, userDetails.onlineStatusWeb];
            let userConnection;
            for (let i = 0; i < connectionIds.length; i++) {
                if (platformStatuses[i] !== "offline") {
                    userConnection = chatHandler_1.chatRouterWs.sockets.get(connectionIds[i]);
                    if (userConnection) {
                        const message = messageId ? await objects_1.database.message.findUnique({ where: { id: messageId } }) : null;
                        const response = action === "saveMessage" || action === "updateMessage" || action === "deleteMessage" ? { action: "recieveMessage", data: message } : { action: "deleteCommunity", communityId };
                        userConnection.emit("response", response);
                        continue;
                    }
                }
                if (userDetails.webLoggedIn && i === 1) {
                    // application sync mechanism
                    await objects_1.database.notification.upsert({
                        where: { userId_communityId_platform: { userId: memberId, communityId, platform: "browser" } },
                        create: { userId: memberId, communityId, platform: "browser", action, type: "community", messageId },
                        update: { action },
                    });
                    continue;
                }
                await objects_1.database.notification.upsert({
                    where: { userId_communityId_platform: { userId: memberId, communityId, platform: "mobile" } },
                    create: { userId: memberId, communityId, platform: "mobile", action, type: "community", messageId },
                    update: { action },
                });
            }
        }));
    }
    async setNotification(chatType, data, socket) {
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
            const setterInfo = (await objects_1.database.user.findUnique({ where: { id: socket.authUserId } }));
            const recipientInfo = (await objects_1.database.user.findUnique({ where: { id: recipientId } }));
            let recipientConnection;
            const connectionIds = [recipientInfo.connectionId, recipientInfo.webConnectionId, setterInfo.connectionId, setterInfo.webConnectionId];
            const platformStatuses = [recipientInfo.onlineStatus, recipientInfo.onlineStatusWeb, setterInfo.onlineStatus, setterInfo.onlineStatusWeb];
            for (let i = 0; i < connectionIds.length; i++) {
                if (platformStatuses[i] !== "offline") {
                    recipientConnection = chatHandler_1.chatRouterWs.sockets.get(connectionIds[i]);
                    if (recipientConnection) {
                        //sending updated message directly if user is online
                        const message = await objects_1.database.message.findUnique({ where: { id: messageId } });
                        recipientConnection.emit("response", { action: "recieveMessage", data: message });
                        continue;
                    }
                }
                if (recipientInfo.webLoggedIn && (i === 1 || i === 3)) {
                    // application sync mechanism
                    await this.saveNotification(messageId, i < 2 ? recipientId : socket.authUserId, "browser");
                    continue;
                }
                await this.saveNotification(messageId, i < 2 ? recipientId : socket.authUserId);
            }
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
                    { userId, platform: socket.isWebUser ? "browser" : "mobile", messageId: { not: null }, action: { not: null } },
                    { userId, platform: socket.isWebUser ? "browser" : "mobile", action: { not: null }, communityId: { not: null } },
                    { userId, platform: socket.isWebUser ? "browser" : "mobile", action: "phoneChange" },
                ],
            },
            include: { message: true },
        })).forEach((notification) => {
            const dataToSend = {
                messages: notification.message,
                action: notification.action,
                communityId: notification.communityId,
                phones: notification.data,
            };
            messages.push(dataToSend);
            notificationIds.push(notification.id);
        });
        // console.log(messages);
        socket.emit("response", { action: "getNotification", data: messages });
        await objects_1.database.notification.deleteMany({ where: { id: { in: notificationIds } } });
    }
    async notifyOnlineMembersOfCall(args) {
        // this method will send an alert to online members of a particular community that a group call for that community has started
        const { allMembersIds, chatRoomId, callerId, callRoomId } = args;
        await Promise.all(allMembersIds.map(async (userId) => {
            const user = await objects_1.database.user.findUnique({ where: { id: userId } });
            const { onlineStatus, onlineStatusWeb, connectionId, webConnectionId } = user;
            if (callerId === userId)
                return;
            const connectionIds = [connectionId, webConnectionId];
            let statusTracker = 0;
            for (let id of connectionIds) {
                if (!id)
                    continue;
                else if ((statusTracker === 0 && onlineStatus === "call") || (statusTracker === 1 && onlineStatusWeb === "call"))
                    return;
                const userConnection = chatHandler_1.chatRouterWs.sockets.get(id);
                if (userConnection) {
                    userConnection.emit("groupCallResponse", { type: "groupCallAlert", chatRoomId, callRoomId });
                }
                statusTracker++;
            }
        }));
    }
    async alertContactsOfUserOnlineStatus(userId) {
        //this method is for alerting a user's contacts he or she chats with of his or her online status(ie online or offline)
        //get user details
        //get all contacts user chats with
        const { contacts, updatedAt, onlineStatus, onlineStatusWeb } = (await objects_1.database.user.findUnique({
            where: { id: userId },
            include: { contacts: { where: { roomId: { not: null }, status: { not: "blocked" } } } },
        }));
        const isUserOnline = onlineStatus !== "offline" || onlineStatusWeb !== "offline";
        await Promise.all(contacts.map(async (contact) => {
            const userDetails = (await objects_1.database.user.findUnique({ where: { phone: contact.phone } }));
            let userConnection;
            const connectionIds = [userDetails.connectionId, userDetails.webConnectionId];
            const platformStatuses = [userDetails.onlineStatus, userDetails.onlineStatusWeb];
            for (let i = 0; i < connectionIds.length; i++) {
                if (platformStatuses[i] !== "offline") {
                    userConnection = chatHandler_1.chatRouterWs.sockets.get(connectionIds[i]);
                    if (userConnection) {
                        //send  data notifying the contacts who are online that this user is online or offline(nb: adding lastSeen for offline)
                        userConnection.emit("response", { action: "checkStatus", roomId: contact.roomId, userStatus: isUserOnline ? "online" : "offline", lastSeen: !isUserOnline ? updatedAt : null });
                    }
                }
            }
        }));
    }
}
exports.ChatNotificationService = ChatNotificationService;
