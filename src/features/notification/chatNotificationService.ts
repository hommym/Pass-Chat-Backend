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
      })
    );
  }

  async setNotification(chatType: RoomType, data: any) {
    if (chatType === "private") {
      await bodyValidatorWs(PrivateChatNotificationDto, data);
      const { messageAction, messageId, recipientId, reaction } = data as PrivateChatNotificationDto;

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
    } else {
      // group or channel
      await bodyValidatorWs(CommunityChatNotificationDto, data);
      const { communityId, messageAction, messageId, reaction, comment } = data as CommunityChatNotificationDto;

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
  }

  async getNotification(socket: Socket) {
    const userId = (socket as SocketV1).authUserId;
    const messages: { action: NotificationAction; messages: Message | null; communityId: number | null; phones: { oldPhone: string; newPhone: string } | null; otpCode: string | null }[] = [];
    const notificationIds: number[] = [];
    // get those notfications and then delete them
    (
      await database.notification.findMany({
        where: {
          OR: [
            { userId, platform: "mobile", messageId: { not: null }, action: { not: null } },
            { userId, platform: "mobile", action: { not: null }, communityId: { not: null } },
            { userId, platform: "mobile", action: "phoneChange" },
            { userId, platform: "mobile", action: "showOtpCode" },
          ],
        },
        include: { message: true },
      })
    ).forEach((notification) => {
      const dataToSend = (notification.data as any).otpCode
        ? {
            messages: notification.message,
            action: notification.action!,
            communityId: notification.communityId,
            phones: null,
            otpCode: (notification.data as any).otpCode,
          }
        : {
            messages: notification.message,
            action: notification.action!,
            communityId: notification.communityId,
            phones: notification.data as any,
            otpCode: null,
          };
      messages.push(dataToSend);
      notificationIds.push(notification.id);
    });
    // console.log(messages);
    socket.emit("response", { action: "getNotification", data: messages });
    await database.notification.deleteMany({ where: { id: { in: notificationIds } } });
  }
}
