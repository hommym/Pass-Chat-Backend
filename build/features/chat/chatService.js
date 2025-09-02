"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const chatHandler_1 = require("./ws/chatHandler");
const date_fns_tz_1 = require("date-fns-tz");
const concurrentTaskExec_1 = require("../../common/helpers/classes/concurrentTaskExec");
class ChatService {
    async setUserOnlineStatus(status, userId, connectionId, isWebUser = false, platform, timezone) {
        if (userId) {
            await objects_1.database.user.update({ where: { id: userId }, data: isWebUser ? { onlineStatusWeb: status, webConnectionId: connectionId, timezone, platform } : { onlineStatus: status, connectionId, timezone, platform } });
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
    async checkChatRoom(roomId, userId = null) {
        // this method checks for a chat room exist
        return await objects_1.database.chatRoom.findUnique({ where: { id: roomId }, include: { community: { include: { members: userId ? { where: { userId: { not: userId } } } : true } } } });
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
        const { roomId, content, dataType, recipientId, senderId, replyTo, roomType, communityId } = message;
        let savedMessage;
        const roomDetails = await this.checkChatRoom(roomId, senderId);
        const senderDetails = (await objects_1.database.user.findUnique({ where: { id: senderId } }));
        if (!roomDetails)
            throw new errorHandler_1.WsError("No ChatRoom with this id exist");
        else if (!roomType || roomType === "private") {
            if (!recipientId)
                throw new errorHandler_1.WsError("No value passed for recipientId");
            else if (roomDetails.user1Id !== recipientId && roomDetails.user2Id !== recipientId)
                throw new errorHandler_1.WsError("The recipient is not a participant of this chatRoom");
            else if (roomDetails.user1Id !== senderId && roomDetails.user2Id !== senderId)
                throw new errorHandler_1.WsError("The sender is not a participant of this chatRoom");
            // save th data in database
            savedMessage = await objects_1.database.message.create({ data: { roomId, content, type: dataType, recipientId, senderId, replyTo, blockedFlag: roomDetails.status == "blocked" } });
            // send the sender a response.
            socket.emit("response", { action: "sendMessage", data: savedMessage });
            //checking if recipient has blocked sender
            if (roomDetails.status === "active") {
                // check if recipient has senders contact and chat room info
                let senderContactInfo = await objects_1.database.userContact.findUnique({ where: { ownerId_phone: { ownerId: recipientId, phone: senderDetails.phone } } });
                let doesRecipientKnowSender = true;
                // console.log(`hello1=${doesRecipientKnowSender},${senderContactInfo?.phone}`);
                if (!senderContactInfo) {
                    senderContactInfo = await objects_1.database.userContact.create({ data: { ownerId: recipientId, phone: senderDetails.phone, roomId } });
                    doesRecipientKnowSender = false;
                    // console.log(`hello2=${doesRecipientKnowSender}`);
                }
                // check if recipient is online
                const recipientInfo = await this.checkUsersOnlineStatus(recipientId);
                if (recipientInfo) {
                    // sync mechanism
                    if (recipientInfo.webLoggedIn)
                        await objects_1.chatNotificationService.saveNotification(savedMessage.id, recipientId, "mobile", "saveMessage");
                    const recipientConnection = chatHandler_1.chatRouterWs.sockets.get(recipientInfo.connectionId);
                    if (recipientConnection) {
                        if (!doesRecipientKnowSender) {
                            const { bio, fullName, phone, username, profile } = senderDetails;
                            const { createdAt, id, type, user1, user2 } = (await objects_1.database.chatRoom.findUnique({ where: { id: roomId }, include: { user1: true, user2: true } }));
                            // console.log(`hello3=${doesRecipientKnowSender}`);
                            recipientConnection.emit("response", {
                                action: "newUserInfo",
                                contact: { bio, contactName: fullName, phone, username, roomId, profile, status: "active" },
                                chatRoom: {
                                    roomId: id,
                                    roomType: type,
                                    createdAt,
                                    participants: [
                                        { id: user1.id, phone: user1.phone },
                                        { id: user2.id, phone: user2.phone },
                                    ],
                                    communityId: null,
                                },
                            });
                        }
                        recipientConnection.emit("response", { action: "recieveMessage", data: savedMessage });
                    }
                    else {
                        // when user is not online
                        if (!doesRecipientKnowSender) {
                            // add notification newUserInfo
                        }
                        await objects_1.chatNotificationService.saveNotification(savedMessage.id, recipientId, "mobile", "saveMessage");
                    }
                }
                else {
                    // when user is not online
                    if (!doesRecipientKnowSender) {
                        // add notification newUserInfo
                    }
                    await objects_1.chatNotificationService.saveNotification(savedMessage.id, recipientId, "mobile", "saveMessage");
                }
            }
            // syn mechanism
            if (socket.isWebUser)
                await objects_1.chatNotificationService.saveNotification(savedMessage.id, senderId, "mobile", "saveMessage");
            else if (senderDetails.webLoggedIn)
                await objects_1.chatNotificationService.saveNotification(savedMessage.id, senderId, "browser", "saveMessage");
        }
        else {
            // for commnunity chat
            if (!communityId)
                throw new errorHandler_1.WsError(`No value passed for communityId`);
            else if (communityId !== roomDetails.community[0].id)
                throw new errorHandler_1.WsError(`roomId used does not belong to this ${roomType}`);
            else if (socket.authUserId !== senderId)
                throw new errorHandler_1.WsError("SenderId used does not belong to this Account");
            if (!(await objects_1.communityService.isMember(communityId, senderId)))
                throw new errorHandler_1.WsError("Sender is not a member");
            objects_1.appEvents.emit("add-to-active-communities", { communityId, userId: senderId, type: roomType });
            savedMessage = await objects_1.database.message.create({ data: { roomId, content, type: dataType, senderId, communityId, replyTo, read: true, recieved: true } });
            // send the sender a response.
            socket.emit("response", { action: "sendMessage", data: savedMessage });
            const allMembers = roomDetails.community[0].members;
            // await database.communityMember.findMany({ where: { communityId } });
            const membersIds = allMembers.map((member) => member.userId);
            objects_1.appEvents.emit("set-community-members-notifications", { action: "saveMessage", communityId, membersIds, platform: "mobile", messageId: savedMessage.id, chatRoomId: null });
        }
    }
    async getUserStatus(socket, data) {
        const { phone, roomId } = data;
        const userInfo = await objects_1.database.user.findUnique({ where: { phone } });
        const { status } = (await objects_1.database.chatRoom.findUnique({ where: { id: roomId } }));
        if (!userInfo) {
            throw new errorHandler_1.WsError("No Account with this id exist");
        }
        const { onlineStatus, updatedAt, onlineStatusWeb, hideOnlineStatus } = userInfo;
        const isUserOnlineM = onlineStatus !== "offline"; // for mobile
        const isUserOnlineW = onlineStatusWeb !== "offline"; // fro web
        socket.emit("response", {
            action: "checkStatus",
            userStatus: isUserOnlineM && status == "active" && !hideOnlineStatus ? onlineStatus : isUserOnlineW && status == "active" && !hideOnlineStatus ? onlineStatusWeb : "offline",
            roomId,
            lastSeen: isUserOnlineM || isUserOnlineW || status == "blocked" || !hideOnlineStatus ? null : updatedAt,
        });
    }
    async setUserStatus(socket, data) {
        // console.log(`Set Status userid=${(socket as SocketV1).authUserId}`);
        const { status, roomId } = data;
        const userId = socket.authUserId; //id of client sending the online status
        //get room deatials
        // check for room type
        const roomDetails = await this.checkChatRoom(roomId);
        if (!roomDetails)
            throw new errorHandler_1.WsError("No ChatRoom with this id exist");
        else if (roomDetails.type === "private" && roomDetails.status === "active") {
            const { user1Id, user2Id } = roomDetails;
            const recipientDetails = await objects_1.database.user.findUnique({ where: { id: user1Id !== userId ? user1Id : user2Id } });
            if (!recipientDetails)
                throw new errorHandler_1.WsError("Participants of this ChatRoom do not exist");
            else if (recipientDetails.onlineStatus === "online") {
                const recipientConnection = chatHandler_1.chatRouterWs.sockets.get(recipientDetails.connectionId);
                if (recipientConnection)
                    recipientConnection.emit("response", { action: "checkStatus", roomId, userStatus: status, lastSeen: null });
            }
            if (recipientDetails.webLoggedIn) {
                if (recipientDetails.onlineStatusWeb === "online") {
                    const recipientConnection = chatHandler_1.chatRouterWs.sockets.get(recipientDetails.webConnectionId);
                    if (recipientConnection)
                        recipientConnection.emit("response", { action: "checkStatus", roomId, userStatus: status, lastSeen: null });
                }
            }
        }
        else if (roomDetails.status === "active") {
            // for groups and channels
        }
        // await database.user.update({ where: { id }, data: { onlineStatus: status } });
    }
    async creatChatRoomDeatils(phone1, phone2, userId) {
        // this is for getting chat room details for
        const user1Details = await objects_1.database.user.findUnique({ where: { phone: phone1 }, select: { id: true, phone: true } });
        const user2Details = await objects_1.database.user.findUnique({ where: { phone: phone2 }, select: { id: true, phone: true } });
        if (!user1Details || !user2Details) {
            throw new errorHandler_1.AppError(!user1Details ? `No Account with ${phone1} exist` : `No Account with ${phone2} exist`, 404);
        }
        const roomDetails = await objects_1.database.chatRoom.findMany({
            where: {
                OR: [
                    { user1Id: user1Details.id, user2Id: user2Details.id },
                    { user1Id: user2Details.id, user2Id: user1Details.id },
                ],
            },
            select: { id: true, createdAt: true, type: true },
        });
        const { type, createdAt, id } = roomDetails.length !== 0
            ? roomDetails[0]
            : await objects_1.database.chatRoom.upsert({
                where: { user1Id_user2Id: { user1Id: user1Details.id, user2Id: user2Details.id } },
                create: { user1Id: user1Details.id, user2Id: user2Details.id, status: "active" },
                update: {},
                select: { id: true, createdAt: true, type: true },
            });
        objects_1.appEvents.emit("update-contacts-roomIds", {
            roomId: id,
            contacts: userId === user1Details.id ? [{ ownerId: user1Details.id, contact: phone2 }] : [{ ownerId: user2Details.id, contact: phone1 }],
        });
        return { roomId: id, createdAt, roomType: type, participants: [user1Details, user2Details] };
    }
    async getAllChatRooms(userId) {
        const { communities } = (await objects_1.database.user.findUnique({ where: { id: userId }, select: { communities: { select: { community: { select: { roomId: true } } } } } }));
        const idsOfCommunitiesChatRomUserIsParticipant = communities.map((communityMemberInfo) => {
            return communityMemberInfo.community.roomId;
        });
        const rooms = await objects_1.database.chatRoom.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }, { id: { in: idsOfCommunitiesChatRomUserIsParticipant } }] },
            select: { id: true, type: true, user1: { select: { phone: true, id: true } }, user2: { select: { phone: true, id: true } }, createdAt: true, community: true },
        });
        const dataToReturn = [];
        rooms.forEach((room) => {
            const { id, createdAt, type, user1, user2, community } = room;
            dataToReturn.push({
                roomId: id,
                roomType: type,
                createdAt,
                participants: type === "private"
                    ? [
                        { id: user1.id, phone: user1.phone },
                        { id: user2.id, phone: user2.phone },
                    ]
                    : null,
                communityId: type !== "private" ? community[0].id : null,
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
        // add code for excluding clear chats
        if (all) {
            const clearChatsId = [];
            const clearedChats = await objects_1.database.clearedChatsTracker.findMany({
                where: chatRoomDetails.type === "private"
                    ? { roomId: chatRoomId, ownerId: clientId }
                    : {
                        OR: [
                            { roomId: chatRoomId, ownerId: clientId, communityId: chatRoomDetails.community[0].id },
                            { roomId: chatRoomId, ownerId: 0, communityId: chatRoomDetails.community[0].id },
                        ],
                    },
            });
            clearedChats.forEach((item) => {
                clearChatsId.push(...item.clearedMessages);
            });
            const messages = await objects_1.database.message.findMany({
                where: {
                    OR: [
                        {
                            roomId: chatRoomId,
                            reportFlag: false,
                            id: { notIn: clearChatsId },
                            senderId: clientId,
                        },
                        { roomId: chatRoomId, reportFlag: false, id: { notIn: clearChatsId }, senderId: { not: clientId }, blockedFlag: false },
                    ],
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
                    OR: [
                        {
                            createdAt: { gte: (0, date_fns_tz_1.fromZonedTime)(startOfDayInUserTimeZone, timeZone), lt: (0, date_fns_tz_1.fromZonedTime)(endOfDayInUserTimeZone, timeZone) },
                            roomId: chatRoomId,
                            reportFlag: false,
                        },
                    ],
                },
                orderBy: { createdAt: "desc" },
            });
            socket.emit("response", { action: "getMessages", messages });
        }
    }
    async updateMessage(userId, messageData, webUser = false) {
        const { messageId, newMessage } = messageData;
        const message = await objects_1.database.message.findUnique({ where: { id: messageId }, include: { room: { include: { community: { include: { members: true } } } } } });
        if (!message)
            throw new errorHandler_1.AppError("No message with this id exist", 404);
        else if (message.senderId !== userId)
            throw new errorHandler_1.AppError("You cannot edit messages you did not send", 402);
        else if (message.type !== "text" && message.type !== "poll")
            throw new errorHandler_1.AppError("Only messages of type text or poll can be edited", 422);
        await objects_1.database.message.update({ where: { id: messageId }, data: { content: newMessage } });
        const roomDetails = message.room;
        if (roomDetails.type === "private") {
            const recipientId = message.recipientId;
            const recipientAccount = (await objects_1.database.user.findUnique({ where: { id: recipientId } }));
            const updaterAccount = (await objects_1.database.user.findUnique({ where: { id: userId } }));
            const connectionIds = [recipientAccount.connectionId, recipientAccount.webConnectionId, updaterAccount.connectionId, updaterAccount.webConnectionId];
            const platformStatuses = [recipientAccount.onlineStatus, recipientAccount.onlineStatusWeb, updaterAccount.onlineStatus, updaterAccount.onlineStatusWeb];
            for (let i = 0; i < connectionIds.length; i++) {
                if (platformStatuses[i] !== "offline") {
                    const userConnection = chatHandler_1.chatRouterWs.sockets.get(connectionIds[i]);
                    if (userConnection) {
                        //sending updated message directly if user is online
                        const message = await objects_1.database.message.findUnique({ where: { id: messageId } });
                        userConnection.emit("response", { action: "recieveMessage", data: message });
                        continue;
                    }
                }
                if (recipientAccount.webLoggedIn && (i === 1 || i === 3) && roomDetails.status === "active") {
                    // application sync mechanism
                    await objects_1.chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId, "browser");
                }
                else if (i === 0 || i === 2)
                    await objects_1.chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId);
            }
        }
        else {
            // for groups or channels message update
            const communityId = roomDetails.community[0].id;
            const allMembers = roomDetails.community[0].members;
            const membersIds = allMembers.map((member) => member.userId);
            objects_1.appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, platform: "mobile", messageId, chatRoomId: null });
        }
    }
    async deleteMessage(messageId, userId, deleteFor = "sender", webUser = false) {
        const message = await objects_1.database.message.findUnique({ where: { id: messageId }, include: { room: { include: { community: { include: { members: true } } } } } });
        if (!message)
            throw new errorHandler_1.AppError("No message with this id exist", 404);
        else if (message.senderId !== userId)
            throw new errorHandler_1.AppError("You cannot delete messages you did not send", 402);
        await objects_1.database.message.update({ where: { id: messageId }, data: { deleteFlag: deleteFor } });
        const roomDetails = message.room;
        if (roomDetails.type === "private") {
            const recipientId = message.recipientId;
            const recipientAccount = (await objects_1.database.user.findUnique({ where: { id: recipientId } }));
            const updaterAccount = (await objects_1.database.user.findUnique({ where: { id: userId } }));
            const connectionIds = [recipientAccount.connectionId, recipientAccount.webConnectionId, updaterAccount.connectionId, updaterAccount.webConnectionId];
            const platformStatuses = [recipientAccount.onlineStatus, recipientAccount.onlineStatusWeb, updaterAccount.onlineStatus, updaterAccount.onlineStatusWeb];
            for (let i = 0; i < connectionIds.length; i++) {
                if (platformStatuses[i] !== "offline") {
                    const userConnection = chatHandler_1.chatRouterWs.sockets.get(connectionIds[i]);
                    if (userConnection) {
                        //sending updated message directly if user is online
                        const message = await objects_1.database.message.findUnique({ where: { id: messageId } });
                        userConnection.emit("response", { action: "recieveMessage", data: message });
                        continue;
                    }
                }
                if (recipientAccount.webLoggedIn && (i === 1 || i === 3) && roomDetails.status === "active") {
                    // application sync mechanism
                    await objects_1.chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId, "browser");
                }
                else if (i === 0 || i === 2)
                    await objects_1.chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId);
            }
        }
        else {
            // for groups or channels message update
            const communityId = roomDetails.community[0].id;
            const allMembers = roomDetails.community[0].members;
            const membersIds = allMembers.map((member) => member.userId);
            objects_1.appEvents.emit("set-community-members-notifications", { action: "deleteMessage", communityId, membersIds, platform: "mobile", messageId, chatRoomId: null });
        }
    }
    async pinMessage(messageId, userId, type) {
        const message = await objects_1.database.message.findUnique({ where: { id: messageId }, include: { room: { include: { community: { include: { members: true } } } } } });
        if (!message)
            throw new errorHandler_1.AppError("No Message With this Id Exist", 404);
        const roomDetails = message.room;
        await objects_1.database.message.update({ where: { id: messageId }, data: { pinned: type === "pin" } });
        if (roomDetails.type !== "private") {
            const communityId = roomDetails.community[0].id;
            const allMembers = roomDetails.community[0].members;
            const membersIds = allMembers.map((member) => member.userId);
            objects_1.appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, platform: "mobile", messageId, chatRoomId: roomDetails.id });
        }
        return { message: type === "pin" ? "Message Pinned Sucessfully" : "Message Unpinned Sucessfully" };
    }
    async clearAllChats(clearChatDto, userId) {
        const { chatRoomId, forAll } = clearChatDto;
        // let clearChatsTracker: ClearedChatsTracker | ClearedChatsTracker[] | null = null;
        let participantsIds;
        const roomDetails = await objects_1.database.chatRoom.findUnique({ where: { id: chatRoomId }, include: { community: { include: { members: { where: { userId: { not: userId } } } } } } });
        if (!roomDetails) {
            throw new errorHandler_1.AppError("No ChatRoom with this id exist", 404);
        }
        const { user1Id, user2Id, community } = roomDetails;
        if (roomDetails.type === "private") {
            participantsIds = forAll ? [userId, user1Id !== userId ? user1Id : user2Id] : [userId];
            await new concurrentTaskExec_1.ConcurrentTaskExec(participantsIds.map(async (participantId) => {
                const clearChatsTracker = await objects_1.database.clearedChatsTracker.findUnique({
                    where: { roomId_ownerId_communityId: { roomId: chatRoomId, ownerId: participantId, communityId: 0 } },
                });
                const alreadyClearedMessagesIds = clearChatsTracker ? clearChatsTracker.clearedMessages : [];
                const messagesToClear = await objects_1.database.message.findMany({ where: { id: { notIn: alreadyClearedMessagesIds } }, select: { id: true } });
                // adding the ids of  messages to be cleared to the already cleared ones
                messagesToClear.forEach((item) => {
                    alreadyClearedMessagesIds.push(item.id);
                });
                await objects_1.database.clearedChatsTracker.upsert({
                    where: { roomId_ownerId_communityId: { roomId: chatRoomId, ownerId: participantId, communityId: 0 } },
                    create: { roomId: chatRoomId, ownerId: participantId, clearedMessages: alreadyClearedMessagesIds },
                    update: { clearedMessages: alreadyClearedMessagesIds },
                });
            })).executeTasks();
            // alert members of cleared message
            objects_1.appEvents.emit("cleared-private-chat-alert", { chatRoomId, userIds: participantsIds });
        }
        else {
            const clearChatsTracker = await objects_1.database.clearedChatsTracker.findUnique({
                where: { roomId_ownerId_communityId: forAll ? { roomId: chatRoomId, ownerId: 0, communityId: community[0].id } : { roomId: chatRoomId, ownerId: userId, communityId: community[0].id } },
            });
            const alreadyClearedMessagesIds = clearChatsTracker ? clearChatsTracker.clearedMessages : [];
            const messagesToClear = await objects_1.database.message.findMany({ where: { id: { notIn: alreadyClearedMessagesIds } }, select: { id: true } });
            // adding the ids of  messages to be cleared to the already cleared ones
            messagesToClear.forEach((item) => {
                alreadyClearedMessagesIds.push(item.id);
            });
            await objects_1.database.clearedChatsTracker.upsert({
                where: { roomId_ownerId_communityId: forAll ? { roomId: chatRoomId, ownerId: 0, communityId: community[0].id } : { roomId: chatRoomId, ownerId: userId, communityId: community[0].id } },
                create: { roomId: chatRoomId, ownerId: forAll ? 0 : userId, clearedMessages: alreadyClearedMessagesIds, communityId: community[0].id },
                update: { clearedMessages: alreadyClearedMessagesIds },
            });
            if (forAll) {
                // alert members of cleared message
                objects_1.appEvents.emit("clear-community-chat-alert", { chatRoomId, comunityMembers: community[0].members });
            }
        }
    }
    async handleUserDisconnection(userId) {
        // check if user is in CallRoom
        const participants = await objects_1.database.callRoomParticipants.findMany({ where: { participantId: userId } });
        if (participants.length === 0)
            return;
        const { callRoomId, id } = participants[0];
        // Get updated call room details
        const callRoomDetails = await objects_1.database.callRoom.findUnique({
            where: { id: callRoomId },
            include: {
                participants: { include: { participant: { select: { profile: true, phone: true, username: true, onlineStatus: true, onlineStatusWeb: true, connectionId: true, webConnectionId: true } } } },
            },
        });
        // Remove the user from the CallRoom
        await objects_1.database.callRoomParticipants.delete({ where: { id } });
        // If there are no participants left in the CallRoom, clear the room
        if (callRoomDetails.participants.length === 1) {
            await objects_1.database.callRoom.delete({ where: { id: callRoomId } });
            return;
        }
        const updatedCallRoomDetails = await objects_1.database.callRoom.findUnique({
            where: { id: callRoomId },
            include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } },
        });
        // Alert all participants of this room that the user has left
        await new concurrentTaskExec_1.ConcurrentTaskExec(callRoomDetails.participants.map(async (participant) => {
            const { connectionId, onlineStatus, onlineStatusWeb, webConnectionId } = participant.participant;
            const statuses = [onlineStatus, onlineStatusWeb];
            let tracker = 0;
            for (let userStatus of statuses) {
                let conId;
                if (userStatus === "call" && tracker === 0)
                    conId = connectionId;
                else if (userStatus === "call" && tracker === 1)
                    conId = webConnectionId;
                else
                    return;
                const participantConnection = chatHandler_1.chatRouterWs.sockets.get(conId);
                if (participantConnection) {
                    participantConnection.emit("groupCallResponse", { type: "userLeft", callRoom: updatedCallRoomDetails });
                }
                tracker++;
            }
        })).executeTasks();
    }
}
exports.ChatService = ChatService;
