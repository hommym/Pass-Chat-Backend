"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallService = void 0;
const uuid_1 = require("uuid");
const objects_1 = require("../../common/constants/objects");
const bodyValidator_1 = require("../../common/middlewares/bodyValidator");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const chatHandler_1 = require("../chat/ws/chatHandler");
const sendIceDetailsDto_1 = require("./dto/sendIceDetailsDto");
const sendSdpAnwerDto_1 = require("./dto/sendSdpAnwerDto");
const sendSdpOfferDto_1 = require("./dto/sendSdpOfferDto");
const cancelCallDto_1 = require("./dto/cancelCallDto");
const publicGroupCallDto_1 = require("./dto/publicGroupCallDto");
const joinOrLeaveGroupCallDto_1 = require("./dto/joinOrLeaveGroupCallDto");
const privateGroupCallDto_1 = require("./dto/privateGroupCallDto");
class CallService {
    async isUserAlreadyInACall(userId, details = null) {
        const userDetails = details ? details : await objects_1.database.user.findUnique({ where: { id: userId } });
        if (!userDetails)
            throw new errorHandler_1.WsError("No User with this account id exist");
        const { onlineStatus, onlineStatusWeb } = userDetails;
        //check online status for web and mobile if user is on a call.
        if (onlineStatus === "call" || onlineStatusWeb === "call")
            return true;
        //check users existence in any CallRoom
        const callRooms = await objects_1.database.callRoomParticipants.findMany({ where: { participantId: userId } });
        if (callRooms.length !== 0)
            return true;
        return false;
    }
    async sendSdpOffer(socket, details, isGroupCall = false) {
        await (0, bodyValidator_1.bodyValidatorWs)(sendSdpOfferDto_1.SendSdpOfferDto, details);
        const { recipientPhone, sdpOffer, roomId, callType } = details;
        const recipientDetails = await objects_1.database.user.findUnique({ where: { phone: recipientPhone } });
        const roomDeatials = await objects_1.chatService.checkChatRoom(roomId);
        const callerId = socket.authUserId;
        if (!isGroupCall && (await this.isUserAlreadyInACall(callerId)))
            throw new errorHandler_1.WsError("Cannot Start Call,User is Already in a call");
        else if (!recipientDetails)
            throw new errorHandler_1.WsError("No account with this phone numeber exist");
        else if (!roomDeatials)
            throw new errorHandler_1.WsError("No ChatRoom with this id exist");
        // update caller online status to call
        await objects_1.database.user.update({ where: { id: callerId }, data: socket.isWebUser ? { onlineStatusWeb: "call" } : { onlineStatus: "call" } });
        const message = await objects_1.database.message.create({
            data: { senderId: callerId, recipientId: recipientDetails.id, content: JSON.stringify({ content: callType, content_id: (0, uuid_1.v4)() }), type: "call", roomId, callType },
        });
        socket.emit("response", { action: "call", callAction: "sendSDPOffer", message });
        //sending offer to mobile
        if (recipientDetails.onlineStatus === "online" && recipientDetails.onlineStatusWeb !== "call") {
            // console.log("Setting Call Notification");
            const recipientConnection = chatHandler_1.chatRouterWs.sockets.get(recipientDetails.connectionId);
            if (recipientConnection) {
                recipientConnection.emit("callResponse", { type: "spdOffer", sdpOffer, message });
            }
        }
        else
            await objects_1.chatNotificationService.saveNotification(message.id, recipientDetails.id, "mobile", "saveMessage");
        //sending offer to web
        if (recipientDetails.onlineStatusWeb === "online" && recipientDetails.onlineStatus !== "call") {
            const recipientWebConnection = chatHandler_1.chatRouterWs.sockets.get(recipientDetails.webConnectionId);
            if (recipientWebConnection) {
                recipientWebConnection.emit("callResponse", { type: "spdOffer", sdpOffer, message });
            }
        }
        else if (recipientDetails.webLoggedIn)
            await objects_1.chatNotificationService.saveNotification(message.id, recipientDetails.id, "browser", "saveMessage");
    }
    async sendSdpAnswer(socket, details, isGroupCall = false) {
        await (0, bodyValidator_1.bodyValidatorWs)(sendSdpAnwerDto_1.SendSdpAnswerDto, details);
        const { callerId, sdpAnswer } = details;
        const callerDetails = await objects_1.database.user.findUnique({ where: { id: callerId } });
        const calleeId = socket.authUserId;
        const calleeDetails = await objects_1.database.user.findUnique({ where: { id: calleeId } });
        const isWebUser = socket.isWebUser;
        if (!isGroupCall && (await this.isUserAlreadyInACall(calleeId, calleeDetails)))
            throw new errorHandler_1.WsError("Cannot Recive Call,User Already in a Call");
        else if (!callerDetails)
            throw new errorHandler_1.WsError("No Account with this id exist");
        // ending call received on other device
        if (isWebUser) {
            if (calleeDetails.onlineStatus === "online") {
                const otherDeviceConnection = chatHandler_1.chatRouterWs.sockets.get(calleeDetails.connectionId);
                if (otherDeviceConnection) {
                    otherDeviceConnection.emit("callResponse", { type: "callPickedByOtherDevice" });
                }
            }
        }
        else {
            if (calleeDetails.onlineStatusWeb === "online") {
                const otherDeviceConnection = chatHandler_1.chatRouterWs.sockets.get(calleeDetails.webConnectionId);
                if (otherDeviceConnection) {
                    otherDeviceConnection.emit("callResponse", { type: "callPickedByOtherDevice" });
                }
            }
        }
        await objects_1.database.user.update({ where: { id: calleeId }, data: isWebUser ? { onlineStatusWeb: "call" } : { onlineStatus: "call" } });
        if (callerDetails.onlineStatus === "call" || callerDetails.onlineStatusWeb === "call") {
            const callerConnection = chatHandler_1.chatRouterWs.sockets.get(callerDetails.onlineStatus === "call" ? callerDetails.connectionId : callerDetails.webConnectionId);
            if (callerConnection) {
                callerConnection.emit("callResponse", { type: "spdAnswer", sdpAnswer });
            }
        }
    }
    async sendIceDetails(socket, details) {
        await (0, bodyValidator_1.bodyValidatorWs)(sendIceDetailsDto_1.SendIceDetailsDto, details);
        const { iceDetails, recipientId } = details;
        const recipientDetails = await objects_1.database.user.findUnique({ where: { id: recipientId } });
        if (!recipientDetails)
            throw new errorHandler_1.WsError("No Account with this id exist");
        if (recipientDetails.onlineStatus === "call" || recipientDetails.onlineStatusWeb === "call") {
            const callerConnection = chatHandler_1.chatRouterWs.sockets.get(recipientDetails.onlineStatus === "call" ? recipientDetails.connectionId : recipientDetails.webConnectionId);
            if (callerConnection) {
                callerConnection.emit("callResponse", { type: "iceDetails", iceDetails });
            }
        }
    }
    async endCall(socket, cancelCallDto) {
        await (0, bodyValidator_1.bodyValidatorWs)(cancelCallDto_1.CancelCallDto, cancelCallDto);
        const { participantsIds } = cancelCallDto;
        const enderId = socket.authUserId;
        const users = await objects_1.database.user.findMany({ where: { id: { in: participantsIds } }, select: { onlineStatus: true, connectionId: true, webConnectionId: true, onlineStatusWeb: true, id: true } });
        await Promise.all(users.map(async (user) => {
            await objects_1.database.user.update({ where: { id: user.id }, data: user.onlineStatus === "call" ? { onlineStatus: "online" } : { onlineStatusWeb: "online" } });
            if ((user.onlineStatus === "call" || user.onlineStatusWeb === "call") && user.id !== enderId) {
                const userConnection = chatHandler_1.chatRouterWs.sockets.get(user.onlineStatus === "call" ? user.connectionId : user.webConnectionId);
                if (userConnection) {
                    userConnection.emit("callResponse", { type: "endCall" });
                }
            }
        }));
    }
    async startPublicGroupCall(publicGroupCallDto, socket) {
        await (0, bodyValidator_1.bodyValidatorWs)(publicGroupCallDto_1.PublicGroupCallDto, publicGroupCallDto);
        const { communityId, callType } = publicGroupCallDto;
        const community = await objects_1.database.community.findUnique({ where: { id: communityId }, select: { callRoom: true, id: true, room: true, members: true, roomId: true, type: true } });
        const callerId = socket.authUserId;
        if (await this.isUserAlreadyInACall(callerId))
            throw new errorHandler_1.WsError("Cannot Start Call,User is Already in a call");
        else if (!community)
            throw new errorHandler_1.WsError("No Community with this id exist");
        else if (community.callRoom.length > 0)
            throw new errorHandler_1.WsError(`A Call Has Already been Started in the ${community.type}`);
        const { id, callRoom, room, roomId, members } = community;
        // creating CallRoom
        const callRoomDetails = await objects_1.database.callRoom.create({ data: { creatorId: callerId, communityId } });
        //Adding Caller to the CallRoom
        await objects_1.database.callRoomParticipants.create({ data: { callRoomId: callRoomDetails.id, participantId: callerId } });
        const message = await objects_1.database.message.create({
            data: { senderId: callerId, content: JSON.stringify({ content: `on-going-${callType}-call`, content_id: (0, uuid_1.v4)() }), type: "call", roomId, callType },
        });
        const membersIds = members.map((member) => member.userId);
        objects_1.appEvents.emit("set-community-members-notifications", { action: "saveMessage", communityId, membersIds, platform: "mobile", messageId: message.id });
        // alerting online mmebers of the community that a group call has been started
        objects_1.appEvents.emit("community-call-notifier", { allMembersIds: membersIds, callerId, chatRoomId: roomId });
        const updatedCallRoomDetails = await objects_1.database.callRoom.findUnique({
            where: { id: callRoomDetails.id },
            include: { participants: { include: { participant: { select: { phone: true, profile: true, username: true } } } } },
        });
        //returning caller the CallRoom details
        socket.emit("groupCallResponse", { type: "startedGroupCall", callRooom: updatedCallRoomDetails });
    }
    async startPrivateGroupCall(socket, privateGroupCall) {
        await (0, bodyValidator_1.bodyValidatorWs)(privateGroupCallDto_1.PrivateGroupCallDto, privateGroupCall);
        const { existingUserPhone, newUserPhone } = privateGroupCall;
        const groupCallerId = socket.authUserId; // the id of the user who started the group call
        const existingUser = await objects_1.database.user.findUnique({ where: { phone: existingUserPhone, type: "user" } });
        if (!existingUser)
            throw new errorHandler_1.WsError("PrivateGroupCall Failed , existingUserPhone is not as associated with any account");
        const newUser = await objects_1.database.user.findUnique({ where: { phone: newUserPhone, type: "user" } });
        if (!newUser)
            throw new errorHandler_1.WsError("PrivateGroupCall Failed , existingUserPhone is not as associated with any account");
        const groupCaller = await objects_1.database.user.findUnique({ where: { id: groupCallerId } });
        // create CallRoom
        const callRoomDetails = await objects_1.database.callRoom.create({ data: { creatorId: groupCallerId, type: "private" } });
        //adding participants of the private call in the call room
        await objects_1.database.callRoomParticipants.createMany({
            data: [
                { participantId: groupCallerId, callRoomId: callRoomDetails.id },
                { participantId: existingUser.id, callRoomId: callRoomDetails.id },
            ],
        });
        // get updated call room details
        const updatedCallRoomDetails = await objects_1.database.callRoom.findUnique({
            where: { id: callRoomDetails.id },
            include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } },
        });
        const participantsAccount = [groupCaller, existingUser, newUser];
        // sending callRoom details to call participants and a GroupCall Request to new user
        for (let account of participantsAccount) {
            const { id, onlineStatus, onlineStatusWeb, connectionId, webConnectionId } = account;
            if (id === groupCallerId) {
                socket.emit("groupCallResponse", { type: "startedGroupCall", callRooom: updatedCallRoomDetails });
                continue;
            }
            const userConnection = id === existingUser.id
                ? chatHandler_1.chatRouterWs.sockets.get(onlineStatus === "call" ? connectionId : webConnectionId)
                : chatHandler_1.chatRouterWs.sockets.get(onlineStatus === "online" ? connectionId : onlineStatusWeb === "online" ? webConnectionId : "N/A");
            if (userConnection) {
                userConnection.emit("groupCallResponse", { type: id === existingUser.id ? "startedGroupCall" : "groupCallRequest", callRooom: updatedCallRoomDetails, from: groupCaller.phone });
            }
        }
    }
    async joinOrLeaveGroupCall(socket, joinOrLeaveGroupCallDto, action = "join") {
        await (0, bodyValidator_1.bodyValidatorWs)(joinOrLeaveGroupCallDto_1.JoinOrLeaveGroupCallDto, joinOrLeaveGroupCallDto);
        const userId = socket.authUserId;
        const isWebUser = socket.isWebUser;
        if ((await this.isUserAlreadyInACall(userId)) && action === "join")
            throw new errorHandler_1.WsError("User Cannot Join A Call,When Already In A Call ");
        const { callRoomId } = joinOrLeaveGroupCallDto;
        let callRoomDetails = await objects_1.database.callRoom.findUnique({
            where: { id: callRoomId },
            include: { participants: { include: { participant: { select: { connectionId: true, webConnectionId: true, onlineStatus: true, onlineStatusWeb: true } } } } },
        });
        //check if this callRoom exist
        if (!callRoomDetails)
            throw new errorHandler_1.WsError("No CallRoom With This Id Exist");
        if (action === "join")
            await objects_1.database.callRoomParticipants.create({ data: { participantId: userId, callRoomId } });
        else {
            await objects_1.database.callRoomParticipants.delete({ where: { callRoomId_participantId: { callRoomId, participantId: userId } } });
            await objects_1.database.user.update({ where: { id: userId }, data: isWebUser ? { onlineStatusWeb: "online" } : { onlineStatus: "online" } });
        }
        // get updated call room details
        const updatedCallRoomDetails = await objects_1.database.callRoom.findUnique({
            where: { id: callRoomId },
            include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } },
        });
        // return response to user who made the request
        socket.emit("groupCallResponse", action === "join" ? { type: "joinedGroupCall", callRoom: updatedCallRoomDetails } : { type: "leftGroupCall" });
        //if there are no participants left in the CallRoom clear the room
        if ((updatedCallRoomDetails === null || updatedCallRoomDetails === void 0 ? void 0 : updatedCallRoomDetails.participants.length) === 0) {
            await objects_1.database.callRoom.delete({ where: { id: callRoomId } });
            return;
        }
        //alert all participants of this room that a new user is has joined or an old one left
        await Promise.all(callRoomDetails.participants.map(async (participant) => {
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
                    participantConnection.emit("groupCallResponse", { type: action === "join" ? "userJoined" : "userLeft", callRoom: updatedCallRoomDetails });
                }
                tracker++;
            }
        }));
    }
}
exports.CallService = CallService;
