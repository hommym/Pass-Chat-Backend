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
class CallService {
    async sendSdpOffer(socket, details) {
        await (0, bodyValidator_1.bodyValidatorWs)(sendSdpOfferDto_1.SendSdpOfferDto, details);
        const { recipientPhone, sdpOffer, roomId, callType } = details;
        const recipientDetails = await objects_1.database.user.findUnique({ where: { phone: recipientPhone } });
        const roomDeatials = await objects_1.chatService.checkChatRoom(roomId);
        const callerId = socket.authUserId;
        // update caller online status to call
        // await database.user.update({ where: { id: callerId }, data: { onlineStatus: "call" } });
        if (!recipientDetails)
            throw new errorHandler_1.WsError("No account with this phone numeber exist");
        else if (!roomDeatials)
            throw new errorHandler_1.WsError("No ChatRoom with this id exist");
        const message = await objects_1.database.message.create({
            data: { senderId: callerId, recipientId: recipientDetails.id, content: JSON.stringify({ content: callType, content_id: (0, uuid_1.v4)() }), type: "call", roomId, callType },
        });
        socket.emit("response", { action: "call", callAction: "sendSDPOffer", message });
        if (recipientDetails.onlineStatus !== "offline" && recipientDetails.onlineStatus !== "call") {
            console.log("Setting Call Notification");
            const recipientConnection = chatHandler_1.chatRouterWs.sockets.get(recipientDetails.connectionId);
            if (recipientConnection) {
                recipientConnection.emit("callResponse", { type: "spdOffer", sdpOffer, message });
                return;
            }
        }
        await objects_1.chatNotificationService.saveNotification(message.id, recipientDetails.id, "mobile", "saveMessage");
    }
    async sendSdpAnswer(socket, details) {
        await (0, bodyValidator_1.bodyValidatorWs)(sendSdpAnwerDto_1.SendSdpAnswerDto, details);
        const { callerId, sdpAnswer } = details;
        const callerDetails = await objects_1.database.user.findUnique({ where: { id: callerId } });
        const calleeId = socket.authUserId;
        await objects_1.database.user.update({ where: { id: calleeId }, data: { onlineStatus: "call" } });
        if (!callerDetails)
            throw new errorHandler_1.WsError("No Account with this id exist");
        if (callerDetails.onlineStatus === "call") {
            const callerConnection = chatHandler_1.chatRouterWs.sockets.get(callerDetails.connectionId);
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
        if (recipientDetails.onlineStatus === "call") {
            const callerConnection = chatHandler_1.chatRouterWs.sockets.get(recipientDetails.connectionId);
            if (callerConnection) {
                callerConnection.emit("callResponse", { type: "iceDetails", iceDetails });
            }
        }
    }
    async cancelCall(socket) {
        const callCancellerId = socket.authUserId;
        await objects_1.database.user.update({ where: { id: callCancellerId }, data: { onlineStatus: "online" } });
    }
}
exports.CallService = CallService;
