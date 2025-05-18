import { Socket } from "socket.io";
import { ChatWsRequestDto } from "../dto/chatWsRequetDto";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { MessageDto } from "../dto/messageDto";
import { chatService, postsService } from "../../../common/constants/objects";
import { CheckStatusDto } from "../dto/checkStatusDto";
import { SetStatusDto } from "../dto/setStatusDto";
import { GetMessagesDto } from "../dto/getMessagesDto";
import { callController } from "../../calls/ws/callController";
import { CallWsRequestDto } from "../../calls/dto/callWsRequestDto";
import { SocketV1 } from "../../../common/helpers/classes/socketV1";
import { GetAllMessagesDto } from "../dto/getAllMesaagesDto";

export const chatController = async (socket: Socket, request: ChatWsRequestDto) => {
  // validate request
  await bodyValidatorWs(ChatWsRequestDto, request);
  const { action, data } = request;

  switch (action) {
    case "sendMessage":
      await bodyValidatorWs(MessageDto, data);
      await chatService.sendMessage(socket, data as MessageDto);
      break;
    case "checkStatus":
      await bodyValidatorWs(CheckStatusDto, data);
      await chatService.getUserStatus(socket, data as CheckStatusDto);
      break;
    case "setStatus":
      await bodyValidatorWs(SetStatusDto, data);
      await chatService.setUserStatus(socket, data as SetStatusDto);
      break;
    case "call":
      await bodyValidatorWs(CallWsRequestDto, data);
      await callController(socket as SocketV1, data as CallWsRequestDto);
      break;
    case "getAllMessages":
      await bodyValidatorWs(GetAllMessagesDto, data);
      await chatService.getMessages(socket, data as GetAllMessagesDto, true);
      break;

    case "getStory":
      await postsService.getStories(socket as SocketV1);
      break;
    default:
      await bodyValidatorWs(GetMessagesDto, data);
      await chatService.getMessages(socket, data as GetMessagesDto);
      break;
  }
};
