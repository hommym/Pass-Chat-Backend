import { CommunityMember, Message, NotificationAction, Platform, PostType, RoomType, Story } from "@prisma/client";
import { bodyValidator, bodyValidatorWs } from "../../common/middlewares/bodyValidator";
import { PrivateChatNotificationDto } from "./dto/privateChatNotficationDto";
import { appEvents, chatNotificationService, database } from "../../common/constants/objects";
import { WsError } from "../../common/middlewares/errorHandler";
import { Socket } from "socket.io";
import { SocketV1 } from "../../common/helpers/classes/socketV1";
import { CommunityChatNotificationDto } from "./dto/communityChatNotificationsDto";
import { SaveCommunityNotificationsArgs } from "../community/dto/saveCommunityNotificationsArgs";
import { CommunityCallNotifier } from "../community/type/communityCallNotifier";
import { chatRouterWs } from "../chat/ws/chatHandler";
import { ConcurrentTaskExec } from "../../common/helpers/classes/concurrentTaskExec";

export class ChatNotificationService {
  async saveNotification(
    messageId: number | null,
    recipientId: number,
    platform: Platform = "mobile",
    action: NotificationAction = "updateMessage",
    chatRoomId: number | null = null,
    storyId: number | null = null
  ) {
    // this is for setting messages notifications and chatroom updates notifications

    // check if any notification with the above details exist
    const notifications = await database.notification.findMany({ where: chatRoomId ? { userId: recipientId, chatRoomId, platform } : { userId: recipientId, messageId, platform, storyId } });

    //create if it does not exist
    if (notifications.length === 0)
      await database.notification.create({ data: chatRoomId ? { userId: recipientId, messageId, platform, action } : { userId: recipientId, chatRoomId, platform, action, storyId } });
    else await database.notification.update({ where: { id: notifications[0].id }, data: { action } });
  }

  async saveCommunityNotifications(args: SaveCommunityNotificationsArgs) {
    // this a method for  updating  all members of a community about what is happening around a community(ie new messages, updated messages,deleted etc.)
    const { action, communityId, membersIds, messageId, chatRoomId } = args;
    const isNotificationTypeMessage = action === "updateMessage" || action === "saveMessage" || action === "deleteMessage";
    const members = await database.user.findMany({ where: { id: { in: membersIds } } });
    await new ConcurrentTaskExec(
      members.map(async (member) => {
        const userDetails = member;
        const connectionIds = [userDetails.connectionId, userDetails.webConnectionId];
        const platformStatuses = [userDetails.onlineStatus, userDetails.onlineStatusWeb];
        let userConnection: Socket | undefined;

        for (let i = 0; i < connectionIds.length; i++) {
          if (platformStatuses[i] !== "offline") {
            userConnection = chatRouterWs.sockets.get(connectionIds[i]!);
            if (userConnection) {
              const message = messageId && isNotificationTypeMessage ? await database.message.findUnique({ where: { id: messageId } }) : null;
              const chatRoom = chatRoomId && action === "updateChatRoom" ? await database.chatRoom.findUnique({ where: { id: chatRoomId } }) : null;
              const community =
                communityId && action === "comunityInfoUpdate"
                  ? await database.community.findUnique({
                      where: { id: communityId },
                      include: {
                        members: { select: { role: true, userDetails: { select: { id: true, phone: true, bio: true, fullName: true, username: true, profile: true } } } },
                        callRoom: { include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } } },
                      },
                      omit: { ownerId: true },
                    })
                  : null;

              if (communityId && community) {
                community.callRoom = community.callRoom.length !== 0 ? (community.callRoom[0] as any) : null;
              }

              const response = isNotificationTypeMessage
                ? { action: "recieveMessage", data: message }
                : action === "updateChatRoom"
                ? { action: "updateChatRoom", chatRoom }
                : action === "comunityInfoUpdate"
                ? { action: "comunityInfoUpdate", senderId: member.id, communityDetails: community }
                : action === "clearChat"
                ? { action: "clearChat", chatRoomId }
                : { action: "deleteCommunity", communityId };

              userConnection.emit("response", response);
              continue;
            }
          }
          // application sync mechanism
          const isWebUser = userDetails.webLoggedIn && i === 1;
          const notifications = await database.notification.findMany({
            where: isNotificationTypeMessage
              ? { userId: member.id, messageId, platform: isWebUser ? "browser" : "mobile" }
              : action === "updateChatRoom" || action === "clearChat"
              ? { userId: member.id, chatRoomId, platform: isWebUser ? "browser" : "mobile", action }
              : { userId: member.id, communityId, platform: isWebUser ? "browser" : "mobile" },
          });

          //create if it does not exist
          if (notifications.length === 0)
            await database.notification.create({
              data: isNotificationTypeMessage
                ? { userId: member.id, messageId, platform: isWebUser ? "browser" : "mobile", action }
                : action === "updateChatRoom" || action === "clearChat"
                ? { userId: member.id, platform: isWebUser ? "browser" : "mobile", action, chatRoomId }
                : { userId: member.id, platform: isWebUser ? "browser" : "mobile", action, communityId },
            });
          else await database.notification.update({ where: { id: notifications[0].id }, data: { action } });
        }
      })
    ).executeTasks();
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
        const oldReaction = message.reactions ? (message.reactions as string[]) : [];
        // adding new reactionto the old ones
        oldReaction.push(reaction);
        await database.message.update({ where: { id: messageId }, data: { reactions: oldReaction } });
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
      appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, messageId, platform: "mobile", chatRoomId: null });
    }
  }

  async getNotification(socket: SocketV1) {
    const userId = socket.authUserId;
    const messages: any[] = [];
    const notificationIds: number[] = [];
    // get those notfications and then delete them
    const notifications = await database.notification.findMany({
      where: {
        userId,
      },
      include: {
        message: true,
        community: {
          include: {
            members: { select: { role: true, userDetails: { select: { id: true, phone: true, bio: true, fullName: true, username: true, profile: true } } } },
            callRoom: { include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } } },
          },
          omit: { ownerId: true },
        },
        chatRoom: { select: { id: true, type: true, createdAt: true, user1: { select: { id: true, phone: true } }, user2: { select: { id: true, phone: true } }, pinnedMessages: true } },
      },
    });

    for (let notification of notifications) {
      let dataToSend: any;

      switch (notification.action) {
        case "deleteCommunity":
          dataToSend = {
            action: notification.action,
            communityId: notification.communityId,
          };
          break;
        case "addStory":
          const story = await database.story.findUnique({ where: { id: notification.storyId! }, omit: { exclude: true, ownerId: true } });
          if (!story) continue;
          dataToSend = {
            action: notification.action,
            story,
          };
          break;
        case "removeStory":
          dataToSend = {
            action: notification.action,
            storyId: notification.storyId,
          };
          break;
        case "comunityInfoUpdate":
          notification.community!.callRoom = notification.community!.callRoom.length !== 0 ? (notification.community!.callRoom[0] as any) : null;
          dataToSend = {
            action: notification.action,
            community: notification.community,
          };
          break;
        case "phoneChange":
          dataToSend = {
            action: notification.action,
            phones: notification.data as any,
          };
          break;
        case "updateChatRoom":
          const roomDetails = notification.chatRoom!;
          dataToSend =
            roomDetails.type === "private"
              ? {
                  action: notification.action,
                  chatRoom: {
                    roomId: roomDetails.id,
                    roomType: roomDetails.type,
                    createdAt: roomDetails.createdAt,
                    pinnedMessages: roomDetails.pinnedMessages,
                    communityId: null,
                    participants: [roomDetails.user1, roomDetails.user2],
                  },
                }
              : {
                  action: notification.action,
                  chatRoom: {
                    roomId: roomDetails.id,
                    roomType: roomDetails.type,
                    createdAt: roomDetails.createdAt,
                    pinnedMessages: roomDetails.pinnedMessages,
                    communityId: notification.communityId,
                    participants: null,
                  },
                };
          break;
        default:
          dataToSend = {
            action: notification.action,
            messages: notification.message,
          };
          break;
      }

      messages.push(dataToSend);
      notificationIds.push(notification.id);
    }
    // console.log(messages);
    socket.emit("response", { action: "getNotification", data: messages });
    await database.notification.deleteMany({ where: { id: { in: notificationIds } } });
  }

  async notifyOnlineMembersOfCall(args: CommunityCallNotifier) {
    // this method will send an alert to online members of a particular community that a group call for that community has started
    const { allMembersIds, chatRoomId, callerId, callRoomId } = args;

    const users = await database.user.findMany({ where: { id: { in: allMembersIds } } });
    await new ConcurrentTaskExec(
      users.map(async (user) => {
        const { onlineStatus, onlineStatusWeb, connectionId, webConnectionId } = user!;

        if (callerId !== user.id) {
          const connectionIds = [connectionId, webConnectionId];
          let statusTracker = 0;
          for (let id of connectionIds) {
            statusTracker++;
            if (!id || (statusTracker === 1 && onlineStatus === "call") || (statusTracker === 2 && onlineStatusWeb === "call")) {
              continue;
            }
            const userConnection = chatRouterWs.sockets.get(id!);
            if (userConnection) {
              userConnection.emit("groupCallResponse", { type: "groupCallAlert", chatRoomId, callRoomId });
            }
          }
        }
      })
    ).executeTasks();
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
    await new ConcurrentTaskExec(
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
    ).executeTasks();
  }

  async notifyUsersOfClearedPrivateChats(args: { userIds: number[]; chatRoomId: number }) {
    const { userIds, chatRoomId } = args;
    const users = await database.user.findMany({
      where: { id: { in: userIds } },
      select: { onlineStatus: true, onlineStatusWeb: true, connectionId: true, webConnectionId: true, id: true, webLoggedIn: true },
    });
    await new ConcurrentTaskExec(
      users.map(async (user) => {
        const { onlineStatus, onlineStatusWeb, connectionId, webConnectionId, webLoggedIn } = user;

        const connectionIds = [connectionId, webConnectionId];

        const platformStatuses = [onlineStatus, onlineStatusWeb];

        for (let i = 0; i < connectionIds.length; i++) {
          if (platformStatuses[i] !== "offline") {
            const userConnection = chatRouterWs.sockets.get(connectionIds[i]!);
            if (userConnection) {
              userConnection.emit("response", { action: "clearChat", chatRoomId });
              continue;
            }
          }

          if (webLoggedIn && i === 1) {
            // application sync mechanism
            await this.saveNotification(null, user.id, "browser", "clearChat", chatRoomId);
            continue;
          }

          await this.saveNotification(null, user.id, "mobile", "clearChat", chatRoomId);
        }
      })
    ).executeTasks();
  }

  async notifyUsersOfClearedCommunityChats(args: { comunityMembers: CommunityMember[]; chatRoomId: number }) {
    const { chatRoomId, comunityMembers } = args;
    const membersIds = comunityMembers.map((member) => member.userId);
    appEvents.emit("set-community-members-notifications", { action: "clearChat", chatRoomId, communityId: 0, membersIds, messageId: 0, platform: "mobile" });
  }

  async notifyUsersOfStory(args: {
    action: "add" | "remove";
    story: {
      content: string;
      id: number;
      type: PostType;
      createdAt: Date;
    };
    contacts: string[];
    ownerPhone: string;
  }) {
    const { action, contacts, story, ownerPhone } = args;
    // get accounts of contacts
    const users = await database.user.findMany({
      where: { phone: { in: contacts } },
      select: { onlineStatus: true, onlineStatusWeb: true, connectionId: true, webConnectionId: true, id: true, webLoggedIn: true },
    });

    // for each user send the alert or set notification
    await new ConcurrentTaskExec(
      users.map(async (user) => {
        const { onlineStatus, onlineStatusWeb, connectionId, webConnectionId, webLoggedIn } = user;

        const connectionIds = [connectionId, webConnectionId];

        const platformStatuses = [onlineStatus, onlineStatusWeb];

        for (let i = 0; i < connectionIds.length; i++) {
          if (platformStatuses[i] !== "offline") {
            const userConnection = chatRouterWs.sockets.get(connectionIds[i]!);
            if (userConnection) {
              if (action === "add") userConnection.emit("response", { action: "addStory", ownerPhone, story });
              else userConnection.emit("response", { action: "removeStory", storyId: story.id });
              continue;
            }
          }

          if (webLoggedIn && i === 1) {
            // application sync mechanism
            await this.saveNotification(null, user.id, "browser", action === "add" ? "addStory" : "removeStory", null, story.id);
            continue;
          }

          await this.saveNotification(null, user.id, "mobile", action === "add" ? "addStory" : "removeStory", null, story.id);
        }
      })
    ).executeTasks();
  }
}
