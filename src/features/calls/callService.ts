import { v4 } from "uuid";
import { appEvents, chatNotificationService, chatService, database } from "../../common/constants/objects";
import { SocketV1 } from "../../common/helpers/classes/socketV1";
import { bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { AppError, WsError } from "../../common/middlewares/errorHandler";
import { chatRouterWs } from "../chat/ws/chatHandler";
import { SendIceDetailsDto } from "./dto/sendIceDetailsDto";
import { SendSdpAnswerDto } from "./dto/sendSdpAnwerDto";
import { SendSdpOfferDto } from "./dto/sendSdpOfferDto";
import { CancelCallDto } from "./dto/cancelCallDto";
import { PublicGroupCallDto } from "./dto/publicGroupCallDto";
import { User } from "@prisma/client";
import { JoinOrLeaveGroupCallDto } from "./dto/joinOrLeaveGroupCallDto";

export class CallService {
  async isUserAlreadyInACall(userId: number, details: User | null = null) {
    const userDetails = details ? details : await database.user.findUnique({ where: { id: userId } });
    if (!userDetails) throw new WsError("No User with this account id exist");
    const { onlineStatus, onlineStatusWeb } = userDetails;
    //check online status for web and mobile if user is on a call.
    if (onlineStatus === "call" || onlineStatusWeb === "call") return true;

    //check users existence in any CallRoom
    const callRooms = await database.callRoomParticipants.findMany({ where: { participantId: userId } });
    if (callRooms.length !== 0) return true;

    return false;
  }

  async sendSdpOffer(socket: SocketV1, details: SendSdpOfferDto, isGroupCall: boolean = false) {
    await bodyValidatorWs(SendSdpOfferDto, details);
    const { recipientPhone, sdpOffer, roomId, callType } = details as SendSdpOfferDto;
    const recipientDetails = await database.user.findUnique({ where: { phone: recipientPhone } });
    const roomDeatials = await chatService.checkChatRoom(roomId);
    const callerId = socket.authUserId;

    if (!isGroupCall && (await this.isUserAlreadyInACall(callerId))) throw new WsError("Cannot Start Call,User is Already in a call");
    else if (!recipientDetails) throw new WsError("No account with this phone numeber exist");
    else if (!roomDeatials) throw new WsError("No ChatRoom with this id exist");
    // update caller online status to call
    await database.user.update({ where: { id: callerId }, data: socket.isWebUser ? { onlineStatusWeb: "call" } : { onlineStatus: "call" } });

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

  async sendSdpAnswer(socket: SocketV1, details: SendSdpAnswerDto, isGroupCall: boolean = false) {
    await bodyValidatorWs(SendSdpAnswerDto, details);
    const { callerId, sdpAnswer } = details;
    const callerDetails = await database.user.findUnique({ where: { id: callerId } });
    const calleeId = socket.authUserId;
    const calleeDetails = await database.user.findUnique({ where: { id: calleeId } });
    const isWebUser = socket.isWebUser;

    if (!isGroupCall && (await this.isUserAlreadyInACall(calleeId, calleeDetails))) throw new WsError("Cannot Recive Call,User Already in a Call");
    else if (!callerDetails) throw new WsError("No Account with this id exist");

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
    const community = await database.community.findUnique({ where: { id: communityId }, select: { callRoom: true, id: true, room: true, members: true, roomId: true, type: true } });
    const callerId = socket.authUserId;

    if (await this.isUserAlreadyInACall(callerId)) throw new WsError("Cannot Start Call,User is Already in a call");
    else if (!community) throw new WsError("No Community with this id exist");
    else if (community.callRoom.length > 0) throw new WsError(`A Call Has Already been Started in the ${community.type}`);
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
    socket.emit("groupCallResponse", { type: "startedGroupCall", callRooom: updatedCallRoomDetails });
  }

  async joinOrLeaveGroupCall(socket: SocketV1, joinOrLeaveGroupCallDto: JoinOrLeaveGroupCallDto, action: "join" | "leave" = "join") {
    await bodyValidatorWs(JoinOrLeaveGroupCallDto, joinOrLeaveGroupCallDto);
    const userId = socket.authUserId;
    if ((await this.isUserAlreadyInACall(userId)) && action === "join") throw new WsError("User Cannot Join A Call,When Already In A Call ");

    const { callRoomId } = joinOrLeaveGroupCallDto;
    let callRoomDetails = await database.callRoom.findUnique({
      where: { id: callRoomId },
      include: { participants: { include: { participant: { select: { connectionId: true, webConnectionId: true, onlineStatus: true, onlineStatusWeb: true } } } } },
    });

    //check if this callRoom exist
    if (!callRoomDetails) throw new WsError("No CallRoom With This Id Exist");

    if (action === "join") await database.callRoomParticipants.create({ data: { participantId: userId, callRoomId } });
    else {
      await database.callRoomParticipants.delete({ where: { callRoomId_participantId: { callRoomId, participantId: userId } } });
    }

    // get updated call room details
    const updatedCallRoomDetails = await database.callRoom.findUnique({
      where: { id: callRoomId },
      include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } },
    });

    // return response to user who made the request
    socket.emit("groupCallResponse", action === "join" ? { type: "joinedGroupCall", callRoom: updatedCallRoomDetails } : { type: "LeftGroupCall" });

    //if there are no participants left in the CallRoom clear the room
    if (updatedCallRoomDetails?.participants.length === 0) await database.callRoom.delete({ where: { id: callRoomId } });

    //alert all participants of this room that a new user is has joined or an old one left
    await Promise.all(
      callRoomDetails.participants.map(async (participant) => {
        const { connectionId, onlineStatus, onlineStatusWeb, webConnectionId } = participant.participant;
        const statuses = [onlineStatus, onlineStatusWeb];
        let tracker = 0;
        for (let userStatus of statuses) {
          let conId;
          if (userStatus === "call" && tracker === 0) conId = connectionId!;
          else if (userStatus === "call" && tracker === 1) conId = webConnectionId!;
          else return;
          const participantConnection = chatRouterWs.sockets.get(conId);
          if (participantConnection) {
            participantConnection.emit("groupCallResponse", { type: action === "join" ? "userJoined" : "userLeft", callRoom: updatedCallRoomDetails });
          }

          tracker++;
        }
      })
    );
  }
}
