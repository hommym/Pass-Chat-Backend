import { chatRouterDef } from "../../features/chat/ws/chatHandler";
import { notificationRouterDef } from "../../features/chat-notification/ws/chatNotificationHandler";

export const wsRouter = (mainPath: string) => {
  chatRouterDef(mainPath);
  notificationRouterDef(mainPath);
};
