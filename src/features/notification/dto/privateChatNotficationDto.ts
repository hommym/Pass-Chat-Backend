import { Expose } from "class-transformer";
import { IsIn, IsInt } from "class-validator";

export class PrivateChatNotificationDto {
  @Expose()
  @IsInt()
  messageId: number;

  @Expose()
  @IsIn(["recieve", "read"])
  messageAction: "recieve" | "read";

  @Expose()
  @IsInt()
  recipientId: number;
}
