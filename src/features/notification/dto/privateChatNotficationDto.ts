import { Expose } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString } from "class-validator";

export class PrivateChatNotificationDto {
  @Expose()
  @IsInt()
  messageId: number;

  @Expose()
  @IsIn(["recieve", "read", "reaction"])
  messageAction: "recieve" | "read" | "reaction";

  @Expose()
  @IsInt()
  recipientId: number;

  @Expose()
  @IsOptional()
  @IsString()
  reaction?: string;
}
