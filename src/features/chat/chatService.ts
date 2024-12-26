import { OnlineStatus, RoomType } from "@prisma/client";
import { chatNotificationService, database } from "../../common/constants/objects";
import { MessageDto } from "./dto/messageDto";
import { AppError, WsError } from "../../common/middlewares/errorHandler";
import { Socket } from "socket.io";
import { CheckStatusDto } from "./dto/checkStatusDto";
import { SetStatusDto } from "./dto/setStatusDto";
import { chatRouterWs } from "./ws/chatHandler";
import { SocketV1 } from "../../common/helpers/classes/socketV1";

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
    const { roomId, content, createdAt, dataType, recipientId, senderId } = message;

    if (!(await this.checkChatRoom(roomId))) throw new WsError("No ChatRoom with this id exist");

    // save th data in database
    const savedMessage = await database.message.create({ data: { roomId, content, type: dataType, recipientId, senderId, createdAt } });

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
    chatNotificationService.saveNotification(savedMessage.id, recipientId);
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

  async getChatRoomDeatils(phone1: string, phone2: string) {
    const user1Details = await database.user.findUnique({ where: { phone: phone1 }, select: { id: true, phone: true } });
    const user2Details = await database.user.findUnique({ where: { phone: phone2 }, select: { id: true, phone: true } });

    if (!user1Details || !user2Details) {
      throw new AppError(!user1Details ? `No Account with ${phone1} exist` : `No Account with ${phone2} exist`, 404);
    }

    const { type, createdAt, id } = await database.chatRoom.upsert({
      where: { user1Id_user2Id: { user1Id: 1, user2Id: 2 } },
      create: { user1Id: user1Details.id, user2Id: user2Details.id },
      update: {},
      select: { id: true, createdAt: true, type: true },
    });

    return { roomId: id, createdAt, roomType: type, participants: [user1Details, user2Details] };
  }
}
