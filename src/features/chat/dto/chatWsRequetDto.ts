import { Expose } from "class-transformer";
import { IsIn, IsNotEmptyObject, IsPositive, IsString } from "class-validator";

export class ChatWsRequestDto {
  @Expose()
  @IsIn(["sendMessage", "sendStatus", "checkStatus", "notifySender"])
  @IsString()
  action: "sendMessage" | "sendStatus" | "checkStatus" | "notifySender";

  @Expose()
  @IsNotEmptyObject()
  data: object;

}
