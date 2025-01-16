import { Expose } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString } from "class-validator";
export class CommunityChatNotificationDto {
  @Expose()
  @IsInt()
  messageId: number;

  @Expose()
  @IsIn(["read", "comment", "reaction"])
  messageAction: "read" | "comment" | "reaction";

  @Expose()
  @IsInt()
  communityId: number;

  @Expose()
  @IsOptional()
  @IsString()
  reaction?: string;

  @Expose()
  @IsOptional()
  @IsString()
  comment?: string;
}
