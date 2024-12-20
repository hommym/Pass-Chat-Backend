import { OnlineStatus, RoomType } from "@prisma/client";
import { database, ws } from "../../common/constants/objects";
import { bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { MessageDto } from "./dto/messageDto";
import { WsError } from "../../common/middlewares/errorHandler";
import { Socket } from "socket.io";
import { NotifySenderDto } from "./dto/notifySenderDto";
import { CheckStatusDto } from "./dto/checkStatusDto";
import { SendStatusDto } from "./dto/sendStatusDto";

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
      const recipientConnection = ws.sockets.sockets.get(recipientInfo.connectionId!);
      if (recipientConnection) {
        recipientConnection.emit("response", { action: "recieveMessage", data: savedMessage });
      } else {
        // set  new message notification
      }
    } else {
      // set new message notification
    }
  }

  async notifySender(socket: Socket, data: NotifySenderDto) {
    const { action, messageId } = data;

    // update the particular message
    const updatedMessage = await database.message.update({ where: { id: messageId }, data: { read: action === "read" ? true : false, recieved: action === "recieved" ? true : false } });

    // send the update to client who made this request
    socket.emit("response", { action: "recieveMessage", data: updatedMessage });

    //if the sender is active send updated data
    const senderInfo = await this.checkUsersOnlineStatus(updatedMessage.recipientId!);
    if (senderInfo) {
      const senderConnection = ws.sockets.sockets.get(senderInfo.connectionId!);
      if (senderConnection) {
        senderConnection.emit("response", { action: "recieveMessage", data: updatedMessage });
      } else {
        // set update message notification
      }
    } else {
      // set update message notification
    }
  }

  async getUsersOnlineStatus(socket: Socket, data: CheckStatusDto) {
    const { userId } = data;
    const userInfo = await database.user.findUnique({ where: { id: userId } });

    if (!userInfo) {
      throw new WsError("No Account with this id exist");
    }
    const { onlineStatus, updatedAt } = userInfo;
    socket.emit("response", { action: "checkStatus", userStatus: onlineStatus !== "offline" ? onlineStatus : updatedAt });
  }

  async sendStatus(socket: Socket, data: SendStatusDto) {
    const { recipientId, status } = data;
    const userInfo = await this.checkUsersOnlineStatus(recipientId);
    if (userInfo) {
      const recipientConnection = ws.sockets.sockets.get(userInfo.connectionId!);
      if (recipientConnection) {
        recipientConnection.emit("response", { action: "recieveStatus", status });
      }
    }
  }
}
