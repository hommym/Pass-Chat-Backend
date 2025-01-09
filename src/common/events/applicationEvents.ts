import Event from "events";
import { RegistrationOtpEmailI, sendRegistrationEmail } from "../../features/email/sendRegisterationEmail";
import { LoginOtpEmailI, sendLogInEmail } from "../../features/email/sendLoginEmail";
import { communityService } from "../constants/objects";

type EventName = {
  "login-otp-email": LoginOtpEmailI;
  "registration-email": RegistrationOtpEmailI;
  "update-community-sub-count": { operation: "add" | "sub"; communityId: number };
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
    this.createListener("update-community-sub-count",communityService.updateCommunitySubCount);
    console.log("Listeners Setup");
  }

  emit<T extends keyof EventName>(eventName: T, data: EventName[T]) {
    this.event.emit(eventName, data);
  }
}
