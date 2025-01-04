import { Socket } from "socket.io";
import { ChatWsRequestDto } from "../dto/chatWsRequetDto";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { MessageDto } from "../dto/messageDto";
import { chatService } from "../../../common/constants/objects";
import { CheckStatusDto } from "../dto/checkStatusDto";
import { SetStatusDto } from "../dto/setStatusDto";
import { GetMessagesDto } from "../dto/getMessagesDto";
import { callController } from "../../calls/ws/callController";
import { CallWsRequestDto } from "../../calls/dto/callWsRequestDto";
import { SocketV1 } from "../../../common/helpers/classes/socketV1";

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
  } else if (action === "call") {
     await bodyValidatorWs(CallWsRequestDto, data);
    await callController(socket as SocketV1, data as CallWsRequestDto);
  } else {
    await bodyValidatorWs(GetMessagesDto, data);
    await chatService.getMessages(socket, data as GetMessagesDto);
  }
};
