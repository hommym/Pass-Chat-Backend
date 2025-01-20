import { NotificationAction, Platform } from "@prisma/client";

export class SaveCommunityNotificationsArgs {
  communityId: number;
  membersIds: number[];
  action: NotificationAction;
  platform: Platform = "mobile";
  messageId: number | null = null;
}
