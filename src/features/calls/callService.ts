import { v4 } from "uuid";
import { chatNotificationService, chatService, database } from "../../common/constants/objects";
import { SocketV1 } from "../../common/helpers/classes/socketV1";
import { bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { WsError } from "../../common/middlewares/errorHandler";
import { chatRouterWs } from "../chat/ws/chatHandler";
import { SendIceDetailsDto } from "./dto/sendIceDetailsDto";
import { SendSdpAnswerDto } from "./dto/sendSdpAnwerDto";
import { SendSdpOfferDto } from "./dto/sendSdpOfferDto";
import { CancelCallDto } from "./dto/cancelCallDto";

export class CallService {
  async sendSdpOffer(socket: SocketV1, details: SendSdpOfferDto) {
    await bodyValidatorWs(SendSdpOfferDto, details);
    const { recipientPhone, sdpOffer, roomId, callType } = details as SendSdpOfferDto;
    const recipientDetails = await database.user.findUnique({ where: { phone: recipientPhone } });
    const roomDeatials = await chatService.checkChatRoom(roomId);
    const callerId = socket.authUserId;

    // update caller online status to call

    await database.user.update({ where: { id: callerId }, data: { onlineStatus: "call" } });

    if (!recipientDetails) throw new WsError("No account with this phone numeber exist");
    else if (!roomDeatials) throw new WsError("No ChatRoom with this id exist");

    const message = await database.message.create({
      data: { senderId: callerId, recipientId: recipientDetails.id, content: JSON.stringify({ content: callType, content_id: v4() }), type: "call", roomId, callType },
    });

    socket.emit("response", { action: "call", callAction: "sendSDPOffer", message });

    if (recipientDetails.onlineStatus === "online") {
      console.log("Setting Call Notification");
      const recipientConnection = chatRouterWs.sockets.get(recipientDetails.connectionId!);
      if (recipientConnection) {
        recipientConnection.emit("callResponse", { type: "spdOffer", sdpOffer, message });
        return;
      }
    }
    await chatNotificationService.saveNotification(message.id, recipientDetails.id, "mobile", "saveMessage");
  }

  async sendSdpAnswer(socket: SocketV1, details: SendSdpAnswerDto) {
    await bodyValidatorWs(SendSdpAnswerDto, details);
    const { callerId, sdpAnswer } = details;
    const callerDetails = await database.user.findUnique({ where: { id: callerId } });
    const calleeId = socket.authUserId;

    await database.user.update({ where: { id: calleeId }, data: { onlineStatus: "call" } });
    if (!callerDetails) throw new WsError("No Account with this id exist");

    if (callerDetails.onlineStatus === "call") {
      const callerConnection = chatRouterWs.sockets.get(callerDetails.connectionId!);
      if (callerConnection) {
        callerConnection.emit("callResponse", { type: "spdAnswer", sdpAnswer });
      }
    }
  }

  async sendIceDetails(socket: SocketV1, details: SendIceDetailsDto) {
    await bodyValidatorWs(SendIceDetailsDto, details);

    const { iceDetails, recipientId } = details;

    const recipientDetails = await database.user.findUnique({ where: { id: recipientId } });

    if (!recipientDetails) throw new WsError("No Account with this id exist");

    if (recipientDetails.onlineStatus === "call") {
      const callerConnection = chatRouterWs.sockets.get(recipientDetails.connectionId!);
      if (callerConnection) {
        callerConnection.emit("callResponse", { type: "iceDetails", iceDetails });
      }
    }
  }

  async endCall(socket: SocketV1, cancelCallDto: CancelCallDto) {
    await bodyValidatorWs(CancelCallDto, cancelCallDto);
    const { participantsIds } = cancelCallDto;
    // const isWebUser = socket.isWebUser;
    await database.user.updateMany({ where: { id: { in: participantsIds } }, data: { onlineStatus: "online" } });

    const users = await database.user.findMany({ where: { id: { in: participantsIds } }, select: { onlineStatus: true, connectionId: true, webConnectionId: true, onlineStatusWeb: true } });
    await Promise.all(
      users.map(async (user) => {
        if (user.onlineStatus !== "offline") {
          const userConnection = chatRouterWs.sockets.get(user.connectionId!);
          if (userConnection) {
            userConnection.emit("callResponse", { type: "endCall" });
          }
        }
      })
    );
  }
}
