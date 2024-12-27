import { Socket } from "socket.io";
import { AuthWsRequestDto } from "../dtos/authWsRequestDto";
import { bodyValidatorWs } from "../../../common/middlewares/bodyValidator";
import { authService } from "../../../common/constants/objects";

export const authController = async (socket: Socket, request: AuthWsRequestDto) => {
  bodyValidatorWs(AuthWsRequestDto, request);
  const { action } = request;

  if (action === "createLoginQrCode") {
    await authService.createLoginQrCode(socket);
  }
  // other actions
};
