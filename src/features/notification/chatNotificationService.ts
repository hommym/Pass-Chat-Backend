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
import { CommunityCallNotifier } from "../community/type/communityCallNotifier";
import { chatRouterWs } from "../chat/ws/chatHandler";

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
    // this a method for  updating  all members of a community about what is happening around a community(ie new messages, updated messages,deleted etc.)
    const { action, communityId, membersIds, messageId } = args;
    await Promise.all(
      membersIds.map(async (memberId) => {
        const userDetails = (await database.user.findUnique({ where: { id: memberId } }))!;
        const connectionIds = [userDetails.connectionId, userDetails.webConnectionId];
        const platformStatuses = [userDetails.onlineStatus, userDetails.onlineStatusWeb];
        let userConnection: Socket | undefined;

        for (let i = 0; i < connectionIds.length; i++) {
          if (platformStatuses[i] !== "offline") {
            userConnection = chatRouterWs.sockets.get(connectionIds[i]!);
            if (userConnection) {
              const message = messageId ? await database.message.findUnique({ where: { id: messageId } }) : null;
              const response =
                action === "saveMessage" || action === "updateMessage" || action === "deleteMessage" ? { action: "recieveMessage", data: message } : { action: "deleteCommunity", communityId };

              userConnection.emit("response", response);
              continue;
            }
          }

          if (userDetails.webLoggedIn && i === 1) {
            // application sync mechanism
            await database.notification.upsert({
              where: { userId_communityId_platform: { userId: memberId, communityId, platform: "browser" } },
              create: { userId: memberId, communityId, platform: "browser", action, type: "community", messageId },
              update: { action },
            });
            continue;
          }

          await database.notification.upsert({
            where: { userId_communityId_platform: { userId: memberId, communityId, platform: "mobile" } },
            create: { userId: memberId, communityId, platform: "mobile", action, type: "community", messageId },
            update: { action },
          });
        }
      })
    );
  }

  async setNotification(chatType: RoomType, data: any, socket: SocketV1) {
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

      const setterInfo = (await database.user.findUnique({ where: { id: socket.authUserId } }))!;
      const recipientInfo = (await database.user.findUnique({ where: { id: recipientId } }))!;
      let recipientConnection: Socket | undefined;

      const connectionIds = [recipientInfo.connectionId, recipientInfo.webConnectionId, setterInfo.connectionId, setterInfo.webConnectionId];
      const platformStatuses = [recipientInfo.onlineStatus, recipientInfo.onlineStatusWeb, setterInfo.onlineStatus, setterInfo.onlineStatusWeb];

      for (let i = 0; i < connectionIds.length; i++) {
        if (platformStatuses[i] !== "offline") {
          recipientConnection = chatRouterWs.sockets.get(connectionIds[i]!);
          if (recipientConnection) {
            //sending updated message directly if user is online
            const message = await database.message.findUnique({ where: { id: messageId } });
            recipientConnection.emit("response", { action: "recieveMessage", data: message });
            continue;
          }
        }

        if (recipientInfo.webLoggedIn && (i === 1 || i === 3)) {
          // application sync mechanism
          await this.saveNotification(messageId, i < 2 ? recipientId : socket.authUserId, "browser");
          continue;
        }

        await this.saveNotification(messageId, i < 2 ? recipientId : socket.authUserId);
      }
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

  async getNotification(socket: SocketV1) {
    const userId = socket.authUserId;
    const messages: { action: NotificationAction; messages: Message | null; communityId: number | null; phones: { oldPhone: string; newPhone: string } | null }[] = [];
    const notificationIds: number[] = [];
    // get those notfications and then delete them
    (
      await database.notification.findMany({
        where: {
          OR: [
            { userId, platform: socket.isWebUser ? "browser" : "mobile", messageId: { not: null }, action: { not: null } },
            { userId, platform: socket.isWebUser ? "browser" : "mobile", action: { not: null }, communityId: { not: null } },
            { userId, platform: socket.isWebUser ? "browser" : "mobile", action: "phoneChange" },
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

  async notifyOnlineMembersOfCall(args: CommunityCallNotifier) {
    // this method will send an alert to online members of a particular community that a group call for that community has started
    const { allMembersIds, chatRoomId, callerId, callRoomId } = args;

    await Promise.all(
      allMembersIds.map(async (userId) => {
        const user = await database.user.findUnique({ where: { id: userId } });
        const { onlineStatus, onlineStatusWeb, connectionId, webConnectionId } = user!;
        if (callerId === userId) return;

        const connectionIds = [connectionId, webConnectionId];
        let statusTracker = 0;
        for (let id of connectionIds) {
          if (!id) continue;
          else if ((statusTracker === 0 && onlineStatus === "call") || (statusTracker === 1 && onlineStatusWeb === "call")) return;
          const userConnection = chatRouterWs.sockets.get(id);
          if (userConnection) {
            userConnection.emit("groupCallResponse", { type: "groupCallAlert", chatRoomId, callRoomId });
          }
          statusTracker++;
        }
      })
    );
  }

  async alertContactsOfUserOnlineStatus(userId: number) {
    //this method is for alerting a user's contacts he or she chats with of his or her online status(ie online or offline)

    //get user details
    //get all contacts user chats with
    const { contacts, updatedAt, onlineStatus, onlineStatusWeb } = (await database.user.findUnique({
      where: { id: userId },
      include: { contacts: { where: { roomId: { not: null }, status: { not: "blocked" } } } },
    }))!;
    const isUserOnline = onlineStatus !== "offline" || onlineStatusWeb !== "offline";
    await Promise.all(
      contacts.map(async (contact) => {
        const userDetails = (await database.user.findUnique({ where: { phone: contact.phone } }))!;
        let userConnection: Socket | undefined;
        const connectionIds = [userDetails.connectionId!, userDetails.webConnectionId!];
        const platformStatuses = [userDetails.onlineStatus, userDetails.onlineStatusWeb];

        for (let i = 0; i < connectionIds.length; i++) {
          if (platformStatuses[i] !== "offline") {
            userConnection = chatRouterWs.sockets.get(connectionIds[i]);
            if (userConnection) {
              //send  data notifying the contacts who are online that this user is online or offline(nb: adding lastSeen for offline)
              userConnection.emit("response", { action: "checkStatus", roomId: contact.roomId, userStatus: isUserOnline ? "online" : "offline", lastSeen: !isUserOnline ? updatedAt : null });
            }
          }
        }
      })
    );
  }
}
