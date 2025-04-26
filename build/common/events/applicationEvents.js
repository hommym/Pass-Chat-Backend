"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppEvents = void 0;
const events_1 = __importDefault(require("events"));
const sendRegisterationEmail_1 = require("../../features/email/sendRegisterationEmail");
const sendLoginEmail_1 = require("../../features/email/sendLoginEmail");
const objects_1 = require("../constants/objects");
const sendCommunityVerificationEmail_1 = require("../../features/email/sendCommunityVerificationEmail");
class AppEvents {
    constructor() {
        this.event = new events_1.default();
    }
    createListener(eventName, method) {
        this.event.on(eventName, method);
    }
    setUpAllListners() {
        // all eventListners are setup here
        console.log("Setting Up event listeners...");
        this.createListener("registration-email", sendRegisterationEmail_1.sendRegistrationEmail);
        this.createListener("login-otp-email", sendLoginEmail_1.sendLogInEmail);
        this.createListener("update-community-sub-count", objects_1.communityService.updateCommunitySubCount);
        this.createListener("set-community-members-notifications", objects_1.chatNotificationService.saveCommunityNotifications);
        this.createListener("add-to-daily-users", objects_1.dashboardService.addToDailyUsers);
        this.createListener("add-to-active-communities", objects_1.dashboardService.addToActiveCommunities);
        this.createListener("update-contacts-roomIds", objects_1.contactsService.updateContactsRommId);
        this.createListener("community-verification-email", sendCommunityVerificationEmail_1.sendCommunityVerificationEmail);
        this.createListener("community-call-notifier", objects_1.chatNotificationService.notifyOnlineMembersOfCall);
        this.createListener("alert-contacts-user-online-status", objects_1.chatNotificationService.alertContactsOfUserOnlineStatus);
        this.createListener("cleared-private-chat-alert", objects_1.chatNotificationService.notifyUsersOfClearedPrivateChats.bind(objects_1.chatNotificationService));
        this.createListener("clear-community-chat-alert", objects_1.chatNotificationService.notifyUsersOfClearedCommunityChats.bind(objects_1.chatNotificationService));
        this.createListener("story-update", objects_1.chatNotificationService.notifyUsersOfStory.bind(objects_1.chatNotificationService));
        console.log("Listeners Setup");
    }
    emit(eventName, data) {
        this.event.emit(eventName, data);
    }
}
exports.AppEvents = AppEvents;
