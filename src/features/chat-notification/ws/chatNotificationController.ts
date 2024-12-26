import { Socket } from "socket.io";
import { ChatNotificationWsRequestDto } from "../dto/chatNotificationWsRequestDto";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { chatNotificationService } from "../../../common/constants/objects";
import { WsError } from "../../../common/middlewares/errorHandler";

export const chatNotificationController = async (socket: Socket, request: ChatNotificationWsRequestDto) => {
  await bodyValidatorWs(ChatNotificationWsRequestDto, request);
  const { action, chatType, data } = request;
  if (action === "setNotification") {
    if (!chatType || !data) throw new WsError("No value passed for chatType or data");
    await chatNotificationService.setNotification(chatType, data);
  } else {
    await chatNotificationService.getNotification(socket);
  }
};
