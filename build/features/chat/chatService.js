"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const chatHandler_1 = require("./ws/chatHandler");
const date_fns_tz_1 = require("date-fns-tz");
class ChatService {
    async setUserOnlineStatus(status, userId, connectionId, isWebUser = false) {
        if (userId) {
            await objects_1.database.user.update({ where: { id: userId }, data: isWebUser ? { onlineStatusWeb: status, webConnectionId: connectionId } : { onlineStatus: status, connectionId } });
            // console.log(`User with id=${userId} is ${status}`);
        }
        else {
            await objects_1.database.user.update({
                where: isWebUser ? { webConnectionId: connectionId } : { connectionId },
                data: isWebUser ? { onlineStatusWeb: status, webConnectionId: null } : { onlineStatus: status, connectionId: null },
            });
            //  console.log(`User with id=${user.id} is ${status}`);
        }
    }
    async checkChatRoom(roomId) {
        // this method checks for a chat room exist
        return await objects_1.database.chatRoom.findUnique({ where: { id: roomId }, include: { community: true } });
    }
    async checkUsersOnlineStatus(userId, checkForWebUser = false) {
        const account = await objects_1.database.user.findUnique({ where: { id: userId } });
        if (account) {
            if (account.onlineStatus !== "offline" && !checkForWebUser)
                return account;
            else if (account.onlineStatusWeb !== "offline")
                return account;
        }
        return null;
    }
    async sendMessage(socket, message) {
        var _a;
        const { roomId, content, dataType, recipientId, senderId, replyTo, roomType, communityId } = message;
        let savedMessage;
        const roomDetails = await this.checkChatRoom(roomId);
        if (!roomDetails)
            throw new errorHandler_1.WsError("No ChatRoom with this id exist");
        else if (!roomType || roomType === "private") {
            if (!recipientId)
                throw new errorHandler_1.WsError("No value passed for recipientId");
            else if (roomDetails.user1Id !== recipientId && roomDetails.user2Id !== recipientId)
                throw new errorHandler_1.WsError("The recipient is not a participant of this chatRoom");
            else if (roomDetails.user1Id !== senderId && roomDetails.user2Id !== senderId)
                throw new errorHandler_1.WsError("Th sender is not a participant of this chatRoom");
            // save th data in database
            savedMessage = await objects_1.database.message.create({ data: { roomId, content, type: dataType, recipientId, senderId, replyTo } });
            // send the sender a response.
            socket.emit("response", { action: "sendMessage", data: savedMessage });
            //checking if recipient has blocked sender
            if (roomDetails.status === "active") {
                // check if recipient is online
                const recipientInfo = await this.checkUsersOnlineStatus(recipientId);
                if (recipientInfo) {
                    // sync mechanism
                    if (recipientInfo.webLoggedIn)
                        await objects_1.chatNotificationService.saveNotification(savedMessage.id, recipientId, "mobile", "saveMessage");
                    const recipientConnection = chatHandler_1.chatRouterWs.sockets.get(recipientInfo.connectionId);
                    if (recipientConnection) {
                        recipientConnection.emit("response", { action: "recieveMessage", data: savedMessage });
                    }
                    else {
                        // when user is not online
                        await objects_1.chatNotificationService.saveNotification(savedMessage.id, recipientId, "mobile", "saveMessage");
                    }
                }
                else {
                    // when user is not online
                    await objects_1.chatNotificationService.saveNotification(savedMessage.id, recipientId, "mobile", "saveMessage");
                }
            }
        }
        else {
            // for commnunity chat
            if (!communityId)
                throw new errorHandler_1.WsError(`No value passed for communityId`);
            else if (communityId !== ((_a = roomDetails.community[0]) === null || _a === void 0 ? void 0 : _a.id))
                throw new errorHandler_1.WsError(`roomId used does not belong to this ${roomType}`);
            if (!(await objects_1.communityService.isMember(communityId, senderId)))
                throw new errorHandler_1.WsError("Sender is not a member");
            objects_1.appEvents.emit("add-to-active-communities", { communityId });
            savedMessage = await objects_1.database.message.create({ data: { roomId, content, type: dataType, senderId, communityId, replyTo, read: true, recieved: true } });
            // send the sender a response.
            socket.emit("response", { action: "sendMessage", data: savedMessage });
            const allMembers = await objects_1.database.communityMember.findMany({ where: { communityId } });
            const membersIds = allMembers.map((member) => member.userId);
            objects_1.appEvents.emit("set-community-members-notifications", { action: "saveMessage", communityId, membersIds, platform: "mobile", messageId: savedMessage.id });
        }
        // syn mechanism
        const senderDetails = (await objects_1.database.user.findUnique({ where: { id: senderId } }));
        if (socket.isWebUser)
            await objects_1.chatNotificationService.saveNotification(savedMessage.id, senderId, "mobile", "saveMessage");
        else if (senderDetails.webLoggedIn)
            await objects_1.chatNotificationService.saveNotification(savedMessage.id, senderId, "browser", "saveMessage");
    }
    async getUserStatus(socket, data) {
        const { phone } = data;
        const userInfo = await objects_1.database.user.findUnique({ where: { phone } });
        if (!userInfo) {
            throw new errorHandler_1.WsError("No Account with this id exist");
        }
        const { onlineStatus, updatedAt, onlineStatusWeb } = userInfo;
        socket.emit("response", { action: "checkStatus", userStatus: onlineStatus !== "offline" ? onlineStatus : onlineStatusWeb !== "offline" ? onlineStatusWeb : updatedAt });
    }
    async setUserStatus(socket, data) {
        const { status } = data;
        const id = socket.authUserId;
        await objects_1.database.user.update({ where: { id }, data: { onlineStatus: status } });
    }
    async creatChatRoomDeatils(phone1, phone2) {
        // this is for getting chat room details for
        const user1Details = await objects_1.database.user.findUnique({ where: { phone: phone1 }, select: { id: true, phone: true } });
        const user2Details = await objects_1.database.user.findUnique({ where: { phone: phone2 }, select: { id: true, phone: true } });
        if (!user1Details || !user2Details) {
            throw new errorHandler_1.AppError(!user1Details ? `No Account with ${phone1} exist` : `No Account with ${phone2} exist`, 404);
        }
        const roomDetails = await objects_1.database.chatRoom.findUnique({ where: { user1Id_user2Id: { user1Id: user2Details.id, user2Id: user1Details.id } }, select: { id: true, createdAt: true, type: true } });
        const { type, createdAt, id } = roomDetails
            ? roomDetails
            : await objects_1.database.chatRoom.upsert({
                where: { user1Id_user2Id: { user1Id: user1Details.id, user2Id: user2Details.id } },
                create: { user1Id: user1Details.id, user2Id: user2Details.id, status: "active" },
                update: {},
                select: { id: true, createdAt: true, type: true },
            });
        objects_1.appEvents.emit("update-contacts-roomIds", {
            roomId: id,
            contacts: [
                { ownerId: user1Details.id, contact: phone2 },
                { ownerId: user2Details.id, contact: phone1 },
            ],
        });
        return { roomId: id, createdAt, roomType: type, participants: [user1Details, user2Details] };
    }
    async getAllChatRooms(userId) {
        const rooms = await objects_1.database.chatRoom.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }], type: "private" },
            select: { id: true, type: true, user1: { select: { phone: true, id: true } }, user2: { select: { phone: true, id: true } }, createdAt: true },
        });
        const dataToReturn = [];
        rooms.forEach((room) => {
            const { id, createdAt, type, user1, user2 } = room;
            dataToReturn.push({
                roomId: id,
                roomType: type,
                createdAt,
                participants: [
                    { id: user1.id, phone: user1.phone },
                    { id: user2.id, phone: user2.phone },
                ],
            });
        });
        return dataToReturn;
    }
    async getMessages(socket, data, all = false) {
        var _a;
        const { chatRoomId } = data;
        const clientId = socket.authUserId;
        const chatRoomDetails = await this.checkChatRoom(chatRoomId);
        if (!chatRoomDetails)
            throw new errorHandler_1.WsError("No ChatRoom with this Id exists");
        else if (chatRoomDetails.type === "private" && !(chatRoomDetails.user1Id === clientId || chatRoomDetails.user2Id === clientId))
            throw new errorHandler_1.WsError("Messages does not belong to this account");
        else if (chatRoomDetails.community.length > 0) {
            if (!(await objects_1.communityService.isMember((_a = chatRoomDetails.community[0]) === null || _a === void 0 ? void 0 : _a.id, clientId)))
                throw new errorHandler_1.WsError(`Messages cannot be retrived, client not a member of ${chatRoomDetails.type}`);
        }
        if (all) {
            const messages = await objects_1.database.message.findMany({
                where: {
                    deleteFlag: false,
                    roomId: chatRoomId,
                    reportFlag: false,
                },
                orderBy: { createdAt: "desc" },
            });
            socket.emit("response", { action: "getAllMessages", messages });
        }
        else {
            const { date, timeZone } = data;
            const startOfDayInUserTimeZone = new Date(`${date}T00:00:00`);
            const endOfDayInUserTimeZone = new Date(`${date}T23:59:59`);
            const messages = await objects_1.database.message.findMany({
                where: {
                    createdAt: { gte: (0, date_fns_tz_1.fromZonedTime)(startOfDayInUserTimeZone, timeZone), lt: (0, date_fns_tz_1.fromZonedTime)(endOfDayInUserTimeZone, timeZone) },
                    deleteFlag: false,
                    roomId: chatRoomId,
                    reportFlag: false,
                },
                orderBy: { createdAt: "desc" },
            });
            socket.emit("response", { action: "getMessages", messages });
        }
    }
    async updateMessage(userId, messageData, webUser = false) {
        const { messageId, newMessage } = messageData;
        const message = await objects_1.database.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw new errorHandler_1.AppError("No message with this id exist", 404);
        else if (message.senderId !== userId)
            throw new errorHandler_1.AppError("You cannot edit messages you did not send", 402);
        else if (message.type !== "text")
            throw new errorHandler_1.AppError("Only messages of type text can be edited", 422);
        await objects_1.database.message.update({ where: { id: messageId }, data: { content: newMessage } });
        await objects_1.chatNotificationService.saveNotification(messageId, message.recipientId);
        // handling sync mechanism and community message update(N/A)
    }
    async deleteMessage(messageId, userId, webUser = false) {
        const message = await objects_1.database.message.findUnique({ where: { id: messageId } });
        if (!message)
            throw new errorHandler_1.AppError("No message with this id exist", 404);
        else if (message.senderId !== userId)
            throw new errorHandler_1.AppError("You cannot edit messages you did not send", 402);
        if (message.recieved) {
            await objects_1.database.message.update({ where: { id: messageId }, data: { deleteFlag: true } });
            await objects_1.chatNotificationService.saveNotification(messageId, message.recipientId, "mobile", "deleteMessage");
            // handling sync mechanism and community message update(N/A)
            return;
        }
        await objects_1.database.message.delete({ where: { id: messageId } });
    }
}
exports.ChatService = ChatService;
