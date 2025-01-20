import Event from "events";
import { RegistrationOtpEmailI, sendRegistrationEmail } from "../../features/email/sendRegisterationEmail";
import { LoginOtpEmailI, sendLogInEmail } from "../../features/email/sendLoginEmail";
import { chatNotificationService, communityService } from "../constants/objects";
import { NotificationAction, Platform } from "@prisma/client";
import { SaveCommunityNotificationsArgs } from "../../features/community/dto/saveCommunityNotificationsArgs";

type EventName = {
  "login-otp-email": LoginOtpEmailI;
  "registration-email": RegistrationOtpEmailI;
  "update-community-sub-count": { operation: "add" | "sub"; communityId: number };
  "set-community-members-notifications": SaveCommunityNotificationsArgs
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
    console.log("Listeners Setup");
  }

  emit<T extends keyof EventName>(eventName: T, data: EventName[T]) {
    this.event.emit(eventName, data);
  }
}
