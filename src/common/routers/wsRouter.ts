import { chatRouterDef } from "../../features/chat/ws/chatHandler";
import { notificationRouterDef } from "../../features/chat-notification/ws/chatNotificationHandler";
import { authRouterDef } from "../../features/auth/ws/authHandler";

export const wsRouter = (mainPath: string) => {
  chatRouterDef(mainPath);
  notificationRouterDef(mainPath);
  authRouterDef(mainPath);
};
