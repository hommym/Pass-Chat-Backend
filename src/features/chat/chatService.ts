import { OnlineStatus, RoomType } from "@prisma/client";
import { chatNotificationService, database } from "../../common/constants/objects";
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
export class ChatService {
  async setUserOnlineStatus(status: OnlineStatus, userId: number | null, connectionId?: string | undefined) {
    if (userId) {
      await database.user.update({ where: { id: userId }, data: { onlineStatus: status, connectionId } });
      // console.log(`User with id=${userId} is ${status}`);
    } else {
      await database.user.update({ where: { connectionId }, data: { onlineStatus: status, connectionId } });
      //  console.log(`User with id=${user.id} is ${status}`);
    }
  }

  async checkChatRoom(roomId: number) {
    // this method checks for a chat room exist
    return await database.chatRoom.findUnique({ where: { id: roomId } });
  }

  private async checkUsersOnlineStatus(userId: number) {
    const account = await database.user.findUnique({ where: { id: userId } });
    if (account) {
      if (account.onlineStatus !== "offline") return account;
    }
    return null;
  }

  async sendMessage(socket: Socket, message: MessageDto) {
    const { roomId, content, dataType, recipientId, senderId, replyTo } = message;

    if (!(await this.checkChatRoom(roomId))) throw new WsError("No ChatRoom with this id exist");

    // save th data in database
    const savedMessage = await database.message.create({ data: { roomId, content, type: dataType, recipientId, senderId, replyTo } });

    // send the sender a response.
    socket.emit("response", { action: "sendMessage", data: savedMessage });

    // check if recipient is online
    const recipientInfo = await this.checkUsersOnlineStatus(recipientId);

    if (recipientInfo) {
      const recipientConnection = chatRouterWs.sockets.get(recipientInfo.connectionId!);
      if (recipientConnection) {
        return recipientConnection.emit("response", { action: "recieveMessage", data: savedMessage });
      }
    }
    // when user is not online
    chatNotificationService.saveNotification(savedMessage.id, recipientId, "mobile", "saveMessage");
  }

  async getUserStatus(socket: Socket, data: CheckStatusDto) {
    const { phone } = data;
    const userInfo = await database.user.findUnique({ where: { phone } });

    if (!userInfo) {
      throw new WsError("No Account with this id exist");
    }
    const { onlineStatus, updatedAt } = userInfo;
    socket.emit("response", { action: "checkStatus", userStatus: onlineStatus !== "offline" ? onlineStatus : updatedAt });
  }

  async setUserStatus(socket: Socket, data: SetStatusDto) {
    const { status } = data;
    const id = (socket as SocketV1).authUserId;
    await database.user.update({ where: { id }, data: { onlineStatus: status } });
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
          create: { user1Id: user1Details.id, user2Id: user2Details.id },
          update: {},
          select: { id: true, createdAt: true, type: true },
        });

    return { roomId: id, createdAt, roomType: type, participants: [user1Details, user2Details] };
  }

  async getAllChatRooms(userId: number) {
    const rooms = await database.chatRoom.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }], type: "private" },
      select: { id: true, type: true, user1: { select: { phone: true, id: true } }, user2: { select: { phone: true, id: true } }, createdAt: true },
    });
    const dataToReturn: object[] = [];
    rooms.forEach((room) => {
      const { id, createdAt, type, user1, user2 } = room;
      dataToReturn.push({
        roomId: id,
        roomType: type,
        createdAt,
        participants: [
          { id: user1!.id, phone: user1!.phone },
          { id: user2!.id, phone: user2!.phone },
        ],
      });
    });
    return dataToReturn;
  }

  async getMessages(socket: Socket, data: GetMessagesDto) {
    const { chatRoomId, date, timeZone } = data;

    const startOfDayInUserTimeZone = new Date(`${date}T00:00:00`);
    const endOfDayInUserTimeZone = new Date(`${date}T23:59:59`);

    const messages = await database.message.findMany({
      where: { createdAt: { gte: fromZonedTime(startOfDayInUserTimeZone, timeZone), lt: fromZonedTime(endOfDayInUserTimeZone, timeZone) }, deleteFlag: false },
      orderBy: { createdAt: "desc" },
    });
    socket.emit("response", { action: "getMessages", messages });
  }

  async updateMessage(userId: number, messageData: UpdateMessageDto) {
    const { messageId, newMessage } = messageData;
    const message = await database.message.findUnique({ where: { id: messageId } });

    if (!message) throw new AppError("No message with this id exist", 404);
    else if (message.senderId !== userId) throw new AppError("You cannot edit messages you did not send", 402);
    else if (message.type !== "text") throw new AppError("Only messages of type text can be edited", 422);

    await database.message.update({ where: { id: messageId }, data: { content: newMessage } });

    await chatNotificationService.saveNotification(messageId, message.recipientId!);
  }

  async deleteMessage(messageId: number, userId: number) {
    const message = await database.message.findUnique({ where: { id: messageId } });

    if (!message) throw new AppError("No message with this id exist", 404);
    else if (message.senderId !== userId) throw new AppError("You cannot edit messages you did not send", 402);

    if (message.recieved) {
      await database.message.update({ where: { id: messageId }, data: { deleteFlag: true } });
      await chatNotificationService.saveNotification(messageId, message.recipientId!, "mobile", "deleteMessage");
      return;
    }
    await database.message.delete({ where: { id: messageId } });
  }
}
