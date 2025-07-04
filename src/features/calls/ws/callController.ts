import { callService, database } from "../../../common/constants/objects";
import { SocketV1 } from "../../../common/helpers/classes/socketV1";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { WsError } from "../../../common/middlewares/errorHandler";
import { CallWsRequestDto } from "../dto/callWsRequestDto";
import { CancelCallDto } from "../dto/cancelCallDto";
import { JoinOrLeaveGroupCallDto } from "../dto/joinOrLeaveGroupCallDto";
import { PrivateGroupCallDto } from "../dto/privateGroupCallDto";
import { PrivateGroupCallInvitationDto } from "../dto/privateGroupCallInvitationDto";
import { PublicGroupCallDto } from "../dto/publicGroupCallDto";
import { SendIceDetailsDto } from "../dto/sendIceDetailsDto";
import { SendSdpAnswerDto } from "../dto/sendSdpAnwerDto";
import { SendSdpOfferDto } from "../dto/sendSdpOfferDto";

export const callController = async (socket: SocketV1, request: CallWsRequestDto) => {
  const { details, callAction } = request;

  switch (callAction) {
    case "sendSDPOffer":
      await callService.sendSdpOffer(socket, details as SendSdpOfferDto);
      break;
    case "sendSDPAnswer":
      await callService.sendSdpAnswer(socket, details as SendSdpAnswerDto);
      break;
    case "sendICEDetails":
      await callService.sendIceDetails(socket, details as SendIceDetailsDto);
      break;
    case "startPublicGroupCall":
      await callService.startPublicGroupCall(details as PublicGroupCallDto, socket);
      break;
    case "startPrivateGroupCall":
      await callService.startPrivateGroupCall(socket, details as PrivateGroupCallDto);
      break;

    case "addUsersToPrivateGroupCall":
      await callService.inviteUsersToPrivateGroupCall(socket, details as PrivateGroupCallInvitationDto);
      break;
    case "endCall":
      await callService.endCall(socket, details as CancelCallDto);
      break;

    case "leaveGroupCall":
      await callService.joinOrLeaveGroupCall(socket, details as JoinOrLeaveGroupCallDto, "leave");
      break;
    default:
      await callService.joinOrLeaveGroupCall(socket, details as JoinOrLeaveGroupCallDto);
      break;
  }
};
