import { Socket } from "socket.io";
import { ChatWsRequestDto } from "../dto/chatWsRequetDto";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { MessageDto } from "../dto/messageDto";
import { chatService } from "../../../common/constants/objects";
import { CheckStatusDto } from "../dto/checkStatusDto";
import { SetStatusDto } from "../dto/setStatusDto";
import { GetMessagesDto } from "../dto/getMessagesDto";

export const chatController = async (socket: Socket, request: ChatWsRequestDto) => {
  // validate request
  await bodyValidatorWs(ChatWsRequestDto, request);
  const { action, data } = request;

  if (action === "sendMessage") {
    await bodyValidatorWs(MessageDto, data);
    await chatService.sendMessage(socket, data as MessageDto);
  } else if (action === "checkStatus") {
    await bodyValidatorWs(CheckStatusDto, data);
    await chatService.getUserStatus(socket, data as CheckStatusDto);
  } else if (action === "setStatus") {
    await bodyValidatorWs(SetStatusDto, data);
    await chatService.setUserStatus(socket, data as SetStatusDto);
  }else{
    await bodyValidatorWs(GetMessagesDto,data)
    await chatService.getMessages(socket,data as GetMessagesDto)
  }
};
