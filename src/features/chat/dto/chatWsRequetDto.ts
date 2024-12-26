import { Expose } from "class-transformer";
import { IsIn, IsNotEmptyObject, IsPositive, IsString } from "class-validator";

export class ChatWsRequestDto {
  @Expose()
  @IsIn(["sendMessage", "setStatus", "checkStatus"])
  @IsString()
  action: "sendMessage" | "setStatus" | "checkStatus";

  @Expose()
  @IsNotEmptyObject()
  data: object;

}
