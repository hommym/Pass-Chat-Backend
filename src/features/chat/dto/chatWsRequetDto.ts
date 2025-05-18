import { Expose } from "class-transformer";
import { IsIn, IsNotEmptyObject, IsPositive, IsString } from "class-validator";

export class ChatWsRequestDto {
  @Expose()
  @IsIn(["sendMessage", "setStatus", "checkStatus", "getMessages", "call", "getAllMessages","getStory"])
  @IsString()
  action: "sendMessage" | "setStatus" | "checkStatus" | "getMessages" | "call" | "getAllMessages" | "getStory";

  @Expose()
  @IsNotEmptyObject()
  data: object;
}
