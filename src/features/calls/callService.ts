import { chatNotificationService, chatService, database } from "../../common/constants/objects";
import { SocketV1 } from "../../common/helpers/classes/socketV1";
import { bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { WsError } from "../../common/middlewares/errorHandler";
import { chatRouterWs } from "../chat/ws/chatHandler";
import { SendIceDetailsDto } from "./dto/sendIceDetailsDto";
import { SendSdpAnswerDto } from "./dto/sendSdpAnwerDto";
import { SendSpdOfferDto } from "./dto/sendSdpOfferDto";

export class CallService {
  async sendSpdOffer(socket: SocketV1, details: SendSpdOfferDto) {
    await bodyValidatorWs(SendSpdOfferDto, details);
    const { recipientPhone, sdpOffer, roomId, callType } = details as SendSpdOfferDto;
    const recipientDetails = await database.user.findUnique({ where: { phone: recipientPhone } });
    const roomDeatials = await chatService.checkChatRoom(roomId);
    const callerId = socket.authUserId;

    if (!recipientDetails) throw new WsError("No account with this phone numeber exist");
    else if (roomDeatials) throw new WsError("No ChatRoom with this id exist");

    const message = await database.message.create({ data: { senderId: callerId, recipientId: recipientDetails.id, content: callType, type: "call", roomId, callType } });

    if (recipientDetails.onlineStatus !== "offline" && recipientDetails.onlineStatus!=="call") {
      const recipientConnection = chatRouterWs.sockets.get(recipientDetails.connectionId!);
      if (recipientConnection) {
        recipientConnection.emit("callResponse", { type: "spdOffer", sdpOffer, message });
      } else {
        await chatNotificationService.saveNotification(message.id, recipientDetails.id, "mobile", "saveMessage");
      }
    }
    socket.emit("response", { action: "call", callAction: "sendSDPOffer", message });
  }

  async sendSpdAnswer(socket: SocketV1, details: SendSdpAnswerDto) {
    await bodyValidatorWs(SendSdpAnswerDto, details);
    const { callerId, sdpAnswer } = details;
    const callerDetails = await database.user.findUnique({ where: { id: callerId } });

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
}