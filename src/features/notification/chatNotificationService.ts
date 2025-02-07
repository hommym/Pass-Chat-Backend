import { Message, NotificationAction, Platform, RoomType } from "@prisma/client";
import { bodyValidator, bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { PrivateChatNotificationDto } from "./dto/privateChatNotficationDto";
import { appEvents, database } from "../../common/constants/objects";
import { WsError } from "../../common/middlewares/errorHandler";
import { Socket } from "socket.io";
import { SocketV1 } from "../../common/helpers/classes/socketV1";
import { CommunityChatNotificationDto } from "./dto/communityChatNotificationsDto";
import { SaveCommunityNotificationsArgs } from "../community/dto/saveCommunityNotificationsArgs";
import { JsonArray } from "@prisma/client/runtime/library";

export class ChatNotificationService {
  async saveNotification(messageId: number, recipientId: number, platform: Platform = "mobile", action: NotificationAction = "updateMessage") {
    // this is for setting messages notifications
    await database.notification.upsert({
      where: { userId_messageId_platform: { userId: recipientId, messageId, platform } },
      create: { userId: recipientId, messageId, platform, action },
      update: { action },
    });
  }

  async saveCommunityNotifications(args: SaveCommunityNotificationsArgs) {
    // this a method for setting notifications for all members of a community
    const { action, communityId, membersIds, messageId, platform } = args;
    await Promise.all(
      membersIds.map(async (memberId) => {
        await database.notification.upsert({
          where: { userId_communityId_platform: { userId: memberId, communityId, platform } },
          create: { userId: memberId, communityId, platform, action, type: "community", messageId },
          update: { action },
        });
        const { webLoggedIn } = (await database.user.findUnique({ where: { id: memberId } }))!;

        // application sync mechanism
        if (webLoggedIn) {
          await database.notification.upsert({
            where: { userId_communityId_platform: { userId: memberId, communityId, platform: "browser" } },
            create: { userId: memberId, communityId, platform: "browser", action, type: "community", messageId },
            update: { action },
          });
        }
      })
    );
  }

  async setNotification(chatType: RoomType, data: any, socket: SocketV1) {
    let messageIdX: number;
    if (chatType === "private") {
      await bodyValidatorWs(PrivateChatNotificationDto, data);
      const { messageAction, messageId, recipientId, reaction } = data as PrivateChatNotificationDto;
      messageIdX = messageId;
      const message = await database.message.findUnique({ where: { id: messageId } });
      if (!message) throw new WsError("No message with this id exist");
      else if (messageAction === "read") {
        await database.message.update({ where: { id: messageId }, data: { read: true } });
      } else if (messageAction === "reaction") {
        if (!reaction) throw new WsError("No Value passed for reaction");
        await database.message.update({ where: { id: messageId }, data: { reactions: message.reactions ? (message.reactions as string[]).push(reaction!) : undefined } });
      } else {
        await database.message.update({ where: { id: messageId }, data: { recieved: true } });
      }
      await this.saveNotification(messageId, recipientId);
      const recipientInfo = (await database.user.findUnique({ where: { id: recipientId } }))!;
      // application sync mechanism
      if (recipientInfo.webLoggedIn) await this.saveNotification(messageId, recipientId, "browser");
    } else {
      // group or channel
      await bodyValidatorWs(CommunityChatNotificationDto, data);
      const { communityId, messageAction, messageId, reaction, comment } = data as CommunityChatNotificationDto;
      messageIdX = messageId;
      const message = await database.message.findUnique({ where: { id: messageId, communityId } });
      const communityMembers = await database.communityMember.findMany({ where: { communityId } });

      if (!message) throw new WsError(`No message with this id exist in this ${chatType}`);
      else if (messageAction === "read") {
        await database.message.update({ where: { id: messageId }, data: { views: { increment: 1 }, recieved: true } });
      } else if (messageAction === "comment") {
        if (!comment) throw new WsError("No Value passed for comment");
        let comments = message.reactions ? (message.reactions as string[]) : [comment];
        if (comments.length >= 1) {
          comments.push(comment);
        }
        await database.message.update({ where: { id: messageId }, data: { comments } });
      } else {
        if (!reaction) throw new WsError("No Value passed for reaction");
        let reactions = message.reactions ? (message.reactions as string[]) : [reaction];
        if (reactions.length >= 1) {
          reactions.push(reaction);
        }
        await database.message.update({ where: { id: messageId }, data: { reactions } });
      }
      const membersIds = communityMembers.map((member) => member.userId);
      appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, messageId, platform: "mobile" });
    }
    // application sync mechanism
    const senderInfo = (await database.user.findUnique({ where: { id: socket.authUserId } }))!;
    if (socket.isWebUser) await this.saveNotification(messageIdX, socket.authUserId);
    else if (senderInfo.webLoggedIn) await this.saveNotification(messageIdX, socket.authUserId, "browser");
  }

  async getNotification(socket: SocketV1) {
    const userId = socket.authUserId;
    const messages: { action: NotificationAction; messages: Message | null; communityId: number | null; phones: { oldPhone: string; newPhone: string } | null; }[] = [];
    const notificationIds: number[] = [];
    // get those notfications and then delete them
    (
      await database.notification.findMany({
        where: {
          OR: [
            { userId, platform: socket.isWebUser ? "browser" : "mobile", messageId: { not: null }, action: { not: null } },
            { userId, platform: socket.isWebUser ? "browser" : "mobile", action: { not: null }, communityId: { not: null } },
            { userId, platform: socket.isWebUser ? "browser" : "mobile", action: "phoneChange" },
            { userId, platform: socket.isWebUser ? "browser" : "mobile", action: "showOtpCode" },
          ],
        },
        include: { message: true },
      })
    ).forEach((notification) => {
      const dataToSend = {
        messages: notification.message,
        action: notification.action!,
        communityId: notification.communityId,
        phones: notification.data as any,
      };
      messages.push(dataToSend);
      notificationIds.push(notification.id);
    });
    // console.log(messages);
    socket.emit("response", { action: "getNotification", data: messages });
    await database.notification.deleteMany({ where: { id: { in: notificationIds } } });
  }
}
