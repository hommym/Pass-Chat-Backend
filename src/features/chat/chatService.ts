import { Message, OnlineStatus, RoomType } from "@prisma/client";
import { appEvents, chatNotificationService, communityService, database } from "../../common/constants/objects";
import { MessageDto } from "./dto/messageDto";
import { AppError, WsError } from "../../common/middlewares/errorHandler";
import { Socket } from "socket.io";
import { CheckStatusDto } from "./dto/checkStatusDto";
import { SetStatusDto } from "./dto/setStatusDto";
import { chatRouterWs } from "./ws/chatHandler";
import { SocketV1 } from "../../common/helpers/classes/socketV1";
import { GetMessagesDto } from "./dto/getMessagesDto";
import { fromZonedTime } from "date-fns-tz";
import { UpdateMessageDto } from "./dto/updateMessageDto";
import { GetAllMessagesDto } from "./dto/getAllMesaagesDto";
export class ChatService {
  async setUserOnlineStatus(status: OnlineStatus, userId: number | null, connectionId?: string | undefined, isWebUser: boolean = false) {
    if (userId) {
      await database.user.update({ where: { id: userId }, data: isWebUser ? { onlineStatusWeb: status, webConnectionId: connectionId } : { onlineStatus: status, connectionId } });
      // console.log(`User with id=${userId} is ${status}`);
    } else {
      await database.user.update({
        where: isWebUser ? { webConnectionId: connectionId } : { connectionId },
        data: isWebUser ? { onlineStatusWeb: status, webConnectionId: null } : { onlineStatus: status, connectionId: null },
      });
      //  console.log(`User with id=${user.id} is ${status}`);
    }
  }

  async checkChatRoom(roomId: number, userId: number | null = null) {
    // this method checks for a chat room exist
    return await database.chatRoom.findUnique({ where: { id: roomId }, include: { community: { include: { members: userId ? { where: { userId: { not: userId } } } : true } } } });
  }

  private async checkUsersOnlineStatus(userId: number, checkForWebUser: boolean = false) {
    const account = await database.user.findUnique({ where: { id: userId } });
    if (account) {
      if (account.onlineStatus !== "offline" && !checkForWebUser) return account;
      else if (account.onlineStatusWeb !== "offline") return account;
    }
    return null;
  }

  async sendMessage(socket: Socket, message: MessageDto) {
    const { roomId, content, dataType, recipientId, senderId, replyTo, roomType, communityId } = message;
    let savedMessage: Message;
    const roomDetails = await this.checkChatRoom(roomId, senderId);
    if (!roomDetails) throw new WsError("No ChatRoom with this id exist");
    else if (!roomType || roomType === "private") {
      if (!recipientId) throw new WsError("No value passed for recipientId");
      else if (roomDetails.user1Id !== recipientId && roomDetails.user2Id !== recipientId) throw new WsError("The recipient is not a participant of this chatRoom");
      else if (roomDetails.user1Id !== senderId && roomDetails.user2Id !== senderId) throw new WsError("Th sender is not a participant of this chatRoom");
      // save th data in database
      savedMessage = await database.message.create({ data: { roomId, content, type: dataType, recipientId, senderId, replyTo } });

      // send the sender a response.
      socket.emit("response", { action: "sendMessage", data: savedMessage });

      //checking if recipient has blocked sender
      if (roomDetails.status === "active") {
        // check if recipient is online
        const recipientInfo = await this.checkUsersOnlineStatus(recipientId!);

        if (recipientInfo) {
          // sync mechanism
          if (recipientInfo.webLoggedIn) await chatNotificationService.saveNotification(savedMessage.id, recipientId!, "mobile", "saveMessage");
          const recipientConnection = chatRouterWs.sockets.get(recipientInfo.connectionId!);
          if (recipientConnection) {
            recipientConnection.emit("response", { action: "recieveMessage", data: savedMessage });
          } else {
            // when user is not online
            await chatNotificationService.saveNotification(savedMessage.id, recipientId!, "mobile", "saveMessage");
          }
        } else {
          // when user is not online
          await chatNotificationService.saveNotification(savedMessage.id, recipientId!, "mobile", "saveMessage");
        }
      }

      // syn mechanism
      const senderDetails = (await database.user.findUnique({ where: { id: senderId } }))!;
      if ((socket as SocketV1).isWebUser) await chatNotificationService.saveNotification(savedMessage.id, senderId, "mobile", "saveMessage");
      else if (senderDetails.webLoggedIn) await chatNotificationService.saveNotification(savedMessage.id, senderId, "browser", "saveMessage");
    } else {
      // for commnunity chat
      if (!communityId) throw new WsError(`No value passed for communityId`);
      else if (communityId !== roomDetails.community[0].id) throw new WsError(`roomId used does not belong to this ${roomType}`);

      if (!(await communityService.isMember(communityId, senderId))) throw new WsError("Sender is not a member");
      appEvents.emit("add-to-active-communities", { communityId, userId: senderId, type: roomType });

      savedMessage = await database.message.create({ data: { roomId, content, type: dataType, senderId, communityId, replyTo, read: true, recieved: true } });
      // send the sender a response.
      socket.emit("response", { action: "sendMessage", data: savedMessage });

      const allMembers = roomDetails.community[0].members;
      // await database.communityMember.findMany({ where: { communityId } });

      const membersIds = allMembers.map((member) => member.userId);
      appEvents.emit("set-community-members-notifications", { action: "saveMessage", communityId, membersIds, platform: "mobile", messageId: savedMessage.id });
    }
  }

  async getUserStatus(socket: Socket, data: CheckStatusDto) {
    const { phone, roomId } = data;
    const userInfo = await database.user.findUnique({ where: { phone } });

    if (!userInfo) {
      throw new WsError("No Account with this id exist");
    }
    const { onlineStatus, updatedAt, onlineStatusWeb } = userInfo;
    const isUserOnlineM = onlineStatus !== "offline"; // for mobile
    const isUserOnlineW = onlineStatusWeb !== "offline"; // fro web
    socket.emit("response", {
      action: "checkStatus",
      userStatus: onlineStatus !== "offline" ? onlineStatus : onlineStatusWeb !== "offline" ? onlineStatusWeb : "offline",
      roomId,
      lastSeen: isUserOnlineM || isUserOnlineW ? null : updatedAt,
    });
  }

  async setUserStatus(socket: Socket, data: SetStatusDto) {
    const { status, roomId } = data;
    const userId = (socket as SocketV1).authUserId; //id of client sending the online status

    //get room deatials
    // check for room type
    const roomDetails = await this.checkChatRoom(roomId);

    if (!roomDetails) throw new WsError("No ChatRoom with this id exist");
    else if (roomDetails.type === "private" && roomDetails.status === "active") {
      const { user1Id, user2Id } = roomDetails;
      const recipientDetails = await database.user.findUnique({ where: { id: user1Id !== userId ? user1Id! : user2Id! } });
      if (!recipientDetails) throw new WsError("Participants of this ChatRoom do not exist");
      else if (recipientDetails.onlineStatus === "online") {
        const recipientConnection = chatRouterWs.sockets.get(recipientDetails.connectionId!);
        if (recipientConnection) recipientConnection.emit("response", { action: "checkStatus", roomId, userStatus: status, lastSeen: null });
      }

      if (recipientDetails.webLoggedIn) {
        if (recipientDetails.onlineStatusWeb === "online") {
          const recipientConnection = chatRouterWs.sockets.get(recipientDetails.webConnectionId!);
          if (recipientConnection) recipientConnection.emit("response", { action: "checkStatus", roomId, userStatus: status, lastSeen: null });
        }
      }
    } else if (roomDetails.status === "active") {
      // for groups and channels
    }

    // await database.user.update({ where: { id }, data: { onlineStatus: status } });
  }

  async creatChatRoomDeatils(phone1: string, phone2: string) {
    // this is for getting chat room details for
    const user1Details = await database.user.findUnique({ where: { phone: phone1 }, select: { id: true, phone: true } });
    const user2Details = await database.user.findUnique({ where: { phone: phone2 }, select: { id: true, phone: true } });

    if (!user1Details || !user2Details) {
      throw new AppError(!user1Details ? `No Account with ${phone1} exist` : `No Account with ${phone2} exist`, 404);
    }

    const roomDetails = await database.chatRoom.findUnique({ where: { user1Id_user2Id: { user1Id: user2Details.id, user2Id: user1Details.id } }, select: { id: true, createdAt: true, type: true } });

    const { type, createdAt, id } = roomDetails
      ? roomDetails
      : await database.chatRoom.upsert({
          where: { user1Id_user2Id: { user1Id: user1Details.id, user2Id: user2Details.id } },
          create: { user1Id: user1Details.id, user2Id: user2Details.id, status: "active" },
          update: {},
          select: { id: true, createdAt: true, type: true },
        });

    appEvents.emit("update-contacts-roomIds", {
      roomId: id,
      contacts: [
        { ownerId: user1Details.id, contact: phone2 },
        { ownerId: user2Details.id, contact: phone1 },
      ],
    });
    return { roomId: id, createdAt, roomType: type, participants: [user1Details, user2Details] };
  }

  async getAllChatRooms(userId: number) {
    const rooms = await database.chatRoom.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }], type: "private" },
      select: { id: true, type: true, user1: { select: { phone: true, id: true } }, user2: { select: { phone: true, id: true } }, createdAt: true, pinnedMessages: true },
    });
    const dataToReturn: object[] = [];
    rooms.forEach((room) => {
      const { id, createdAt, type, user1, user2, pinnedMessages } = room;
      dataToReturn.push({
        roomId: id,
        roomType: type,
        createdAt,
        participants: [
          { id: user1!.id, phone: user1!.phone },
          { id: user2!.id, phone: user2!.phone },
        ],
        pinnedMessages,
      });
    });
    return dataToReturn;
  }

  async getMessages(socket: Socket, data: GetMessagesDto | GetAllMessagesDto, all: boolean = false) {
    const { chatRoomId } = data;
    const clientId = (socket as SocketV1).authUserId;
    const chatRoomDetails = await this.checkChatRoom(chatRoomId);

    if (!chatRoomDetails) throw new WsError("No ChatRoom with this Id exists");
    else if (chatRoomDetails.type === "private" && !(chatRoomDetails.user1Id === clientId || chatRoomDetails.user2Id === clientId)) throw new WsError("Messages does not belong to this account");
    else if (chatRoomDetails.community.length > 0) {
      if (!(await communityService.isMember(chatRoomDetails.community[0]?.id, clientId))) throw new WsError(`Messages cannot be retrived, client not a member of ${chatRoomDetails.type}`);
    }

    if (all) {
      const messages = await database.message.findMany({
        where: {
          deleteFlag: false,
          roomId: chatRoomId,
          reportFlag: false,
        },
        orderBy: { createdAt: "desc" },
      });
      socket.emit("response", { action: "getAllMessages", messages });
    } else {
      const { date, timeZone } = data as GetMessagesDto;
      const startOfDayInUserTimeZone = new Date(`${date}T00:00:00`);
      const endOfDayInUserTimeZone = new Date(`${date}T23:59:59`);

      const messages = await database.message.findMany({
        where: {
          createdAt: { gte: fromZonedTime(startOfDayInUserTimeZone, timeZone), lt: fromZonedTime(endOfDayInUserTimeZone, timeZone) },
          deleteFlag: false,
          roomId: chatRoomId,
          reportFlag: false,
        },
        orderBy: { createdAt: "desc" },
      });
      socket.emit("response", { action: "getMessages", messages });
    }
  }

  async updateMessage(userId: number, messageData: UpdateMessageDto, webUser: boolean = false) {
    const { messageId, newMessage } = messageData;
    const message = await database.message.findUnique({ where: { id: messageId }, include: { room: { include: { community: { include: { members: true } } } } } });

    if (!message) throw new AppError("No message with this id exist", 404);
    else if (message.senderId !== userId) throw new AppError("You cannot edit messages you did not send", 402);
    else if (message.type !== "text" && message.type !== "poll") throw new AppError("Only messages of type text or poll can be edited", 422);

    await database.message.update({ where: { id: messageId }, data: { content: newMessage } });
    const roomDetails = message.room;

    if (roomDetails.type === "private" && roomDetails.status === "active") {
      const recipientId = message.recipientId!;
      const recipientAccount = (await database.user.findUnique({ where: { id: recipientId } }))!;
      const updaterAccount = (await database.user.findUnique({ where: { id: userId } }))!;

      const connectionIds = [recipientAccount.connectionId, recipientAccount.webConnectionId, updaterAccount.connectionId, updaterAccount.webConnectionId];
      const platformStatuses = [recipientAccount.onlineStatus, recipientAccount.onlineStatusWeb, updaterAccount.onlineStatus, updaterAccount.onlineStatusWeb];

      for (let i = 0; i < connectionIds.length; i++) {
        if (platformStatuses[i] !== "offline") {
          const userConnection = chatRouterWs.sockets.get(connectionIds[i]!);
          if (userConnection) {
            //sending updated message directly if user is online
            const message = await database.message.findUnique({ where: { id: messageId } });
            userConnection.emit("response", { action: "recieveMessage", data: message });
            continue;
          }
        }

        if (recipientAccount.webLoggedIn && (i === 1 || i === 3)) {
          // application sync mechanism
          await chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId, "browser");
          continue;
        }

        await chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId);
      }
    } else {
      // for groups or channels message update
      const communityId = roomDetails.community[0].id;
      const allMembers = roomDetails.community[0].members;

      const membersIds = allMembers.map((member) => member.userId);
      appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, platform: "mobile", messageId });
    }
  }

  async deleteMessage(messageId: number, userId: number, webUser: boolean = false) {
    const message = await database.message.findUnique({ where: { id: messageId }, include: { room: { include: { community: { include: { members: true } } } } } });

    if (!message) throw new AppError("No message with this id exist", 404);
    else if (message.senderId !== userId) throw new AppError("You cannot delete messages you did not send", 402);

    await database.message.update({ where: { id: messageId }, data: { deleteFlag: true } });
    const roomDetails = message.room;

    if (roomDetails.type === "private" && roomDetails.status === "active") {
      const recipientId = message.recipientId!;
      const recipientAccount = (await database.user.findUnique({ where: { id: recipientId } }))!;
      const updaterAccount = (await database.user.findUnique({ where: { id: userId } }))!;

      const connectionIds = [recipientAccount.connectionId, recipientAccount.webConnectionId, updaterAccount.connectionId, updaterAccount.webConnectionId];
      const platformStatuses = [recipientAccount.onlineStatus, recipientAccount.onlineStatusWeb, updaterAccount.onlineStatus, updaterAccount.onlineStatusWeb];

      for (let i = 0; i < connectionIds.length; i++) {
        if (platformStatuses[i] !== "offline") {
          const userConnection = chatRouterWs.sockets.get(connectionIds[i]!);
          if (userConnection) {
            //sending updated message directly if user is online
            const message = await database.message.findUnique({ where: { id: messageId } });
            userConnection.emit("response", { action: "recieveMessage", data: message });
            continue;
          }
        }

        if (recipientAccount.webLoggedIn && (i === 1 || i === 3)) {
          // application sync mechanism
          await chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId, "browser");
          continue;
        }

        await chatNotificationService.saveNotification(messageId, i < 2 ? recipientId : userId);
      }
    } else {
      // for groups or channels message update
      const communityId = roomDetails.community[0].id;
      const allMembers = roomDetails.community[0].members;

      const membersIds = allMembers.map((member) => member.userId);
      appEvents.emit("set-community-members-notifications", { action: "deleteMessage", communityId, membersIds, platform: "mobile", messageId });
    }
  }

  async pinMessage(messageId: number) {
    const message = await database.message.findUnique({ where: { id: messageId }, include: { room: true } });
    if (!message) throw new AppError("No Message With this Id Exist", 404);
    const { id, pinnedMessages } = message.room;
    const pinnedMessageIds = pinnedMessages ? (pinnedMessages as number[]) : [];
    pinnedMessageIds.push(messageId);
    await database.chatRoom.update({ where: { id: id }, data: { pinnedMessages: pinnedMessageIds } });
    return { message: "Message Pinned Sucessfully" };
  }

  async handleUserDisconnection(userId: number) {
    // check if user is in CallRoom
    const participants = await database.callRoomParticipants.findMany({ where: { participantId: userId } });
    if (participants.length === 0) return;

    const { callRoomId, id } = participants[0];

    // Get updated call room details
    const callRoomDetails = await database.callRoom.findUnique({
      where: { id: callRoomId },
      include: {
        participants: { include: { participant: { select: { profile: true, phone: true, username: true, onlineStatus: true, onlineStatusWeb: true, connectionId: true, webConnectionId: true } } } },
      },
    });

    // Remove the user from the CallRoom
    await database.callRoomParticipants.delete({ where: { id } });

    // If there are no participants left in the CallRoom, clear the room
    if (callRoomDetails!.participants.length === 1) {
      await database.callRoom.delete({ where: { id: callRoomId } });
      return;
    }

    const updatedCallRoomDetails = await database.callRoom.findUnique({
      where: { id: callRoomId },
      include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } },
    });

    // Alert all participants of this room that the user has left
    await Promise.all(
      callRoomDetails!.participants.map(async (participant) => {
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
            participantConnection.emit("groupCallResponse", { type: "userLeft", callRoom: updatedCallRoomDetails });
          }
          tracker++;
        }
      })
    );
  }
}
