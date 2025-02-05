import { Expose } from "class-transformer";
import { IsIn, IsNotEmptyObject, IsPositive, IsString } from "class-validator";

export class ChatWsRequestDto {
  @Expose()
  @IsIn(["sendMessage", "setStatus", "checkStatus", "getMessages", "call", "getAllMessages"])
  @IsString()
  action: "sendMessage" | "setStatus" | "checkStatus" | "getMessages" | "call" | "getAllMessages";

  @Expose()
  @IsNotEmptyObject()
  data: object;
}
