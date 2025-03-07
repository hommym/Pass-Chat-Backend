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
class CallService {
    async sendSdpOffer(socket, details) {
        await (0, bodyValidator_1.bodyValidatorWs)(sendSdpOfferDto_1.SendSdpOfferDto, details);
        const { recipientPhone, sdpOffer, roomId, callType } = details;
        const recipientDetails = await objects_1.database.user.findUnique({ where: { phone: recipientPhone } });
        const roomDeatials = await objects_1.chatService.checkChatRoom(roomId);
        const callerId = socket.authUserId;
        // update caller online status to call
        await objects_1.database.user.update({ where: { id: callerId }, data: socket.isWebUser ? { onlineStatusWeb: "call" } : { onlineStatus: "call" } });
        if (!recipientDetails)
            throw new errorHandler_1.WsError("No account with this phone numeber exist");
        else if (!roomDeatials)
            throw new errorHandler_1.WsError("No ChatRoom with this id exist");
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
    async sendSdpAnswer(socket, details) {
        await (0, bodyValidator_1.bodyValidatorWs)(sendSdpAnwerDto_1.SendSdpAnswerDto, details);
        const { callerId, sdpAnswer } = details;
        const callerDetails = await objects_1.database.user.findUnique({ where: { id: callerId } });
        const calleeId = socket.authUserId;
        const calleeDetails = await objects_1.database.user.findUnique({ where: { id: calleeId } });
        const isWebUser = socket.isWebUser;
        if (!callerDetails)
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
        // const isWebUser = socket.isWebUser;
        const users = await objects_1.database.user.findMany({ where: { id: { in: participantsIds } }, select: { onlineStatus: true, connectionId: true, webConnectionId: true, onlineStatusWeb: true, id: true } });
        await Promise.all(users.map(async (user) => {
            await objects_1.database.user.update({ where: { id: user.id }, data: user.onlineStatus === "call" ? { onlineStatus: "online" } : { onlineStatusWeb: "online" } });
            if (user.onlineStatus === "call" || user.onlineStatusWeb === "call") {
                const userConnection = chatHandler_1.chatRouterWs.sockets.get(user.onlineStatus === "call" ? user.connectionId : user.webConnectionId);
                if (userConnection) {
                    userConnection.emit("callResponse", { type: "endCall" });
                }
            }
        }));
    }
}
exports.CallService = CallService;
