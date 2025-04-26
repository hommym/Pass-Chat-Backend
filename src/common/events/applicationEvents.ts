import Event from "events";
import { RegistrationOtpEmailI, sendRegistrationEmail } from "../../features/email/sendRegisterationEmail";
import { LoginOtpEmailI, sendLogInEmail } from "../../features/email/sendLoginEmail";
import { chatNotificationService, communityService, contactsService, dashboardService } from "../constants/objects";
import { CommunityMember, CommunityType, NotificationAction, OS, Platform, PostType, Story } from "@prisma/client";
import { SaveCommunityNotificationsArgs } from "../../features/community/dto/saveCommunityNotificationsArgs";
import { CommunityVerificationEmail, sendCommunityVerificationEmail } from "../../features/email/sendCommunityVerificationEmail";
import { CommunityCallNotifier } from "../../features/community/type/communityCallNotifier";


type EventName = {
  "login-otp-email": LoginOtpEmailI;
  "registration-email": RegistrationOtpEmailI;
  "update-community-sub-count": { operation: "add" | "sub"; communityId: number };
  "set-community-members-notifications": SaveCommunityNotificationsArgs;
  "add-to-daily-users": { userId: number; platform: OS; timezone: string };
  "add-to-active-communities": { communityId: number; userId: number; type: CommunityType };
  "update-contacts-roomIds": { roomId: number; contacts: { contact: string; ownerId: number }[] };
  "community-verification-email": CommunityVerificationEmail;
  "community-call-notifier": CommunityCallNotifier;
  "alert-contacts-user-online-status": number;
  "cleared-private-chat-alert": { userIds: number[]; chatRoomId: number };
  "clear-community-chat-alert": { comunityMembers: CommunityMember[]; chatRoomId: number };
  "story-update": {
    action: "add" | "remove";
    story: {
      content: string;
      id: number;
      type: PostType;
      createdAt: Date;
    };
    contacts: string[];
    ownerPhone: string;
  };
};

export class AppEvents {
  private event = new Event();

  private createListener(eventName: string, method: any) {
    this.event.on(eventName, method);
  }

  setUpAllListners() {
    // all eventListners are setup here
    console.log("Setting Up event listeners...");
    this.createListener("registration-email", sendRegistrationEmail);
    this.createListener("login-otp-email", sendLogInEmail);
    this.createListener("update-community-sub-count", communityService.updateCommunitySubCount);
    this.createListener("set-community-members-notifications", chatNotificationService.saveCommunityNotifications);
    this.createListener("add-to-daily-users", dashboardService.addToDailyUsers);
    this.createListener("add-to-active-communities", dashboardService.addToActiveCommunities);
    this.createListener("update-contacts-roomIds", contactsService.updateContactsRommId);
    this.createListener("community-verification-email", sendCommunityVerificationEmail);
    this.createListener("community-call-notifier", chatNotificationService.notifyOnlineMembersOfCall);
    this.createListener("alert-contacts-user-online-status", chatNotificationService.alertContactsOfUserOnlineStatus);
    this.createListener("cleared-private-chat-alert", chatNotificationService.notifyUsersOfClearedPrivateChats.bind(chatNotificationService));
    this.createListener("clear-community-chat-alert", chatNotificationService.notifyUsersOfClearedCommunityChats.bind(chatNotificationService));
    this.createListener("story-update", chatNotificationService.notifyUsersOfStory.bind(chatNotificationService));
    console.log("Listeners Setup");
  }

  emit<T extends keyof EventName>(eventName: T, data: EventName[T]) {
    this.event.emit(eventName, data);
  }
}
