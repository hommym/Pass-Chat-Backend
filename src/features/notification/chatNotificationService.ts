import { Message, NotificationAction, Platform, RoomType } from "@prisma/client";
import { bodyValidator, bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { PrivateChatNotificationDto } from "./dto/privateChatNotficationDto";
import { database } from "../../common/constants/objects";
import { WsError } from "../../common/middlewares/errorHandler";
import { Socket } from "socket.io";
import { SocketV1 } from "../../common/helpers/classes/socketV1";

export class ChatNotificationService {
  async saveNotification(messageId: number, recipientId: number, platform: Platform = "mobile", action: NotificationAction = "updateMessage") {
    // this is for setting messages notifications
    await database.notification.upsert({
      where: { userId_messageId_platform: { userId: recipientId, messageId, platform } },
      create: { userId: recipientId, messageId, platform, action },
      update: { action },
    });
  }

  async saveCommunityNotifications(communityId: number, membersIds: number[], action: NotificationAction, platform: Platform = "mobile", messageId: number | null = null) {
    // this a method for setting notifications for all members of a community
    await Promise.all(
      membersIds.map(async (memberId) => {
        await database.notification.upsert({
          where: { userId_communityId_platform: { userId: memberId, communityId, platform } },
          create: { userId: memberId, communityId, platform, action, type: "community", messageId },
          update: { action },
        });
      })
    );
  }

  async setNotification(chatType: RoomType, data: any) {
    if (chatType === "private") {
      await bodyValidatorWs(PrivateChatNotificationDto, data);
      const { messageAction, messageId, recipientId } = data as PrivateChatNotificationDto;

      const message = await database.message.findUnique({ where: { id: messageId } });
      if (!message) throw new WsError("No message with this id exist");
      else if (messageAction === "read") {
        await database.message.update({ where: { id: messageId }, data: { read: true } });
      } else {
        await database.message.update({ where: { id: messageId }, data: { recieved: true } });
      }
      await this.saveNotification(messageId, recipientId);
    } else if (chatType === "channel") {
      // N/A
    } else {
      // group
      // N/A
    }
  }

  async getNotification(socket: Socket) {
    const userId = (socket as SocketV1).authUserId;
    const messages: { action: NotificationAction; messages: Message }[] = [];
    const notificationIds: number[] = [];
    // get those notfications and then delete them
    (await database.notification.findMany({ where: { userId, platform: "mobile", messageId: { not: null }, action: { not: null } }, include: { message: true } })).forEach((notification) => {
      messages.push({ messages: notification.message!, action: notification.action! });
      notificationIds.push(notification.id);
    });
    console.log(messages);
    socket.emit("response", { action: "getNotification", data: messages });
    await database.notification.deleteMany({ where: { id: { in: notificationIds } } });
  }
}
