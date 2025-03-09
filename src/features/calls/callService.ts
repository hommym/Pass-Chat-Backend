import { v4 } from "uuid";
import { appEvents, chatNotificationService, chatService, database } from "../../common/constants/objects";
import { SocketV1 } from "../../common/helpers/classes/socketV1";
import { bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { WsError } from "../../common/middlewares/errorHandler";
import { chatRouterWs } from "../chat/ws/chatHandler";
import { SendIceDetailsDto } from "./dto/sendIceDetailsDto";
import { SendSdpAnswerDto } from "./dto/sendSdpAnwerDto";
import { SendSdpOfferDto } from "./dto/sendSdpOfferDto";
import { CancelCallDto } from "./dto/cancelCallDto";
import { PublicGroupCallDto } from "./dto/publicGroupCallDto";

export class CallService {
  async sendSdpOffer(socket: SocketV1, details: SendSdpOfferDto) {
    await bodyValidatorWs(SendSdpOfferDto, details);
    const { recipientPhone, sdpOffer, roomId, callType } = details as SendSdpOfferDto;
    const recipientDetails = await database.user.findUnique({ where: { phone: recipientPhone } });
    const roomDeatials = await chatService.checkChatRoom(roomId);
    const callerId = socket.authUserId;

    // update caller online status to call

    await database.user.update({ where: { id: callerId }, data: socket.isWebUser ? { onlineStatusWeb: "call" } : { onlineStatus: "call" } });

    if (!recipientDetails) throw new WsError("No account with this phone numeber exist");
    else if (!roomDeatials) throw new WsError("No ChatRoom with this id exist");

    const message = await database.message.create({
      data: { senderId: callerId, recipientId: recipientDetails.id, content: JSON.stringify({ content: callType, content_id: v4() }), type: "call", roomId, callType },
    });

    socket.emit("response", { action: "call", callAction: "sendSDPOffer", message });

    //sending offer to mobile
    if (recipientDetails.onlineStatus === "online" && recipientDetails.onlineStatusWeb !== "call") {
      // console.log("Setting Call Notification");
      const recipientConnection = chatRouterWs.sockets.get(recipientDetails.connectionId!);
      if (recipientConnection) {
        recipientConnection.emit("callResponse", { type: "spdOffer", sdpOffer, message });
      }
    } else await chatNotificationService.saveNotification(message.id, recipientDetails.id, "mobile", "saveMessage");

    //sending offer to web
    if (recipientDetails.onlineStatusWeb === "online" && recipientDetails.onlineStatus !== "call") {
      const recipientWebConnection = chatRouterWs.sockets.get(recipientDetails.webConnectionId!);
      if (recipientWebConnection) {
        recipientWebConnection.emit("callResponse", { type: "spdOffer", sdpOffer, message });
      }
    } else if (recipientDetails.webLoggedIn) await chatNotificationService.saveNotification(message.id, recipientDetails.id, "browser", "saveMessage");
  }

  async sendSdpAnswer(socket: SocketV1, details: SendSdpAnswerDto) {
    await bodyValidatorWs(SendSdpAnswerDto, details);
    const { callerId, sdpAnswer } = details;
    const callerDetails = await database.user.findUnique({ where: { id: callerId } });
    const calleeId = socket.authUserId;
    const calleeDetails = await database.user.findUnique({ where: { id: calleeId } });
    const isWebUser = socket.isWebUser;

    if (!callerDetails) throw new WsError("No Account with this id exist");

    // ending call received on other device
    if (isWebUser) {
      if (calleeDetails!.onlineStatus === "online") {
        const otherDeviceConnection = chatRouterWs.sockets.get(calleeDetails!.connectionId!);
        if (otherDeviceConnection) {
          otherDeviceConnection.emit("callResponse", { type: "callPickedByOtherDevice" });
        }
      }
    } else {
      if (calleeDetails!.onlineStatusWeb === "online") {
        const otherDeviceConnection = chatRouterWs.sockets.get(calleeDetails!.webConnectionId!);
        if (otherDeviceConnection) {
          otherDeviceConnection.emit("callResponse", { type: "callPickedByOtherDevice" });
        }
      }
    }

    await database.user.update({ where: { id: calleeId }, data: isWebUser ? { onlineStatusWeb: "call" } : { onlineStatus: "call" } });

    if (callerDetails.onlineStatus === "call" || callerDetails.onlineStatusWeb === "call") {
      const callerConnection = chatRouterWs.sockets.get(callerDetails.onlineStatus === "call" ? callerDetails.connectionId! : callerDetails.webConnectionId!);
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

    if (recipientDetails.onlineStatus === "call" || recipientDetails.onlineStatusWeb === "call") {
      const callerConnection = chatRouterWs.sockets.get(recipientDetails.onlineStatus === "call" ? recipientDetails.connectionId! : recipientDetails.webConnectionId!);
      if (callerConnection) {
        callerConnection.emit("callResponse", { type: "iceDetails", iceDetails });
      }
    }
  }

  async endCall(socket: SocketV1, cancelCallDto: CancelCallDto) {
    await bodyValidatorWs(CancelCallDto, cancelCallDto);
    const { participantsIds } = cancelCallDto;
    const enderId = socket.authUserId;

    const users = await database.user.findMany({ where: { id: { in: participantsIds } }, select: { onlineStatus: true, connectionId: true, webConnectionId: true, onlineStatusWeb: true, id: true } });
    await Promise.all(
      users.map(async (user) => {
        await database.user.update({ where: { id: user.id }, data: user.onlineStatus === "call" ? { onlineStatus: "online" } : { onlineStatusWeb: "online" } });
        if ((user.onlineStatus === "call" || user.onlineStatusWeb === "call") && user.id !== enderId) {
          const userConnection = chatRouterWs.sockets.get(user.onlineStatus === "call" ? user.connectionId! : user.webConnectionId!);
          if (userConnection) {
            userConnection.emit("callResponse", { type: "endCall" });
          }
        }
      })
    );
  }

  async startPublicGroupCall(publicGroupCallDto: PublicGroupCallDto, socket: SocketV1) {
    await bodyValidatorWs(PublicGroupCallDto, publicGroupCallDto);
    const { communityId, callType } = publicGroupCallDto;
    const community = await database.community.findUnique({ where: { id: communityId }, select: { callRoom: true, id: true, room: true, members: true, roomId: true } });
    const callerId = socket.authUserId;

    if (!community) throw new WsError("No Community with this id exist");
    else if (community.callRoom.length > 0) throw new WsError("A call has already been started");
    const { id, callRoom, room, roomId, members } = community;

    // creating CallRoom
    const callRoomDetails = await database.callRoom.create({ data: { creatorId: callerId, communityId } });

    //Adding Caller to the CallRoom
    await database.callRoomParticipants.create({ data: { callRoomId: callRoomDetails.id, participantId: callerId } });

    const message = await database.message.create({
      data: { senderId: callerId, content: JSON.stringify({ content: `on-going-${callType}-call`, content_id: v4() }), type: "call", roomId, callType },
    });

    const membersIds = members.map((member) => member.userId);
    appEvents.emit("set-community-members-notifications", { action: "saveMessage", communityId, membersIds, platform: "mobile", messageId: message.id });

    // alerting online mmebers of the community that a group call has been started
    appEvents.emit("community-call-notifier", { allMembersIds: membersIds, callerId, chatRoomId: roomId });

    const updatedCallRoomDetails = await database.callRoom.findUnique({
      where: { id: callRoomDetails.id },
      include: { participants: { include: { participant: { select: { phone: true, profile: true, username: true } } } } },
    });

    //returning caller the CallRoom details
    socket.emit("groupCallResponse", { type: "CallRoomDetails", callRooom: updatedCallRoomDetails });
  }
}
