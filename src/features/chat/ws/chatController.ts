import { Socket } from "socket.io";
import { ChatWsRequestDto } from "../dto/chatWsRequetDto";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { MessageDto } from "../dto/messageDto";
import { chatService } from "../../../common/constants/objects";
import { NotifySenderDto } from "../dto/notifySenderDto";
import { CheckStatusDto } from "../dto/checkStatusDto";
import { SendStatusDto } from "../dto/sendStatusDto";

export const chatController = async (socket: Socket, request: ChatWsRequestDto) => {
  // validate request
  try {
    await bodyValidatorWs(ChatWsRequestDto, request);
    const { action, data } = request;

    if (action === "sendMessage") {
      await bodyValidatorWs(MessageDto, data);
      await chatService.sendMessage(socket, data as MessageDto);
    } else if (action === "checkStatus") {
      await bodyValidatorWs(CheckStatusDto, data);
      await chatService.getUsersOnlineStatus(socket, data as CheckStatusDto);
    } else if (action === "sendStatus") {
      await bodyValidatorWs(SendStatusDto, data);
      await chatService.sendStatus(socket, data as SendStatusDto);
    } else {
      await bodyValidatorWs(NotifySenderDto, data);
      await chatService.notifySender(socket, data as NotifySenderDto);
    }
  } catch (error: any) {
    socket.emit("error", { message: error.message });
  }
};
