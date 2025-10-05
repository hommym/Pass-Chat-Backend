import { chatRouterDef } from "../../features/chat/ws/chatHandler";
import { notificationRouterDef } from "../../features/notification/ws/chatNotificationHandler";
import { authRouterDef } from "../../features/auth/ws/authHandler";
import { crossServerMsgDef } from "../../sys_features/cross_msg/ws/crossMsgRouterHandler";

export const wsRouter = (mainPath: string,isSystem=false) => {
  if(isSystem){
    crossServerMsgDef(mainPath)
  }else{
    chatRouterDef(mainPath);
    notificationRouterDef(mainPath);
    authRouterDef(mainPath);
  }
  
};
