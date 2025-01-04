import { callService, database } from "../../../common/constants/objects";
import { SocketV1 } from "../../../common/helpers/classes/socketV1";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { WsError } from "../../../common/middlewares/errorHandler";
import { CallWsRequestDto } from "../dto/callWsRequestDto";
import { SendIceDetailsDto } from "../dto/sendIceDetailsDto";
import { SendSdpAnswerDto } from "../dto/sendSdpAnwerDto";
import { SendSpdOfferDto } from "../dto/sendSdpOfferDto";

export const callController = async (socket: SocketV1, request: CallWsRequestDto) => {
  const { details, callAction } = request;

  if (callAction === "sendSDPOffer") {
    await callService.sendSpdOffer(socket, details as SendSpdOfferDto);
  } else if (callAction === "sendSDPAnswer") {
    await callService.sendSpdAnswer(socket, details as SendSdpAnswerDto);
  } else if (callAction === "sendICEDetails") {
    await callService.sendIceDetails(socket, details as SendIceDetailsDto);
  } else if (callAction === "startGroupCall") {
  } else {
  }
};
