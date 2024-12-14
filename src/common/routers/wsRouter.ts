import { chatRouterDef } from "../../features/chat/ws/chatHandler";

export const wsRouter = (mainPath: string) => {
  chatRouterDef(mainPath);
};
