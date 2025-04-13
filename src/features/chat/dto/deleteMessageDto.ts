import { MessageDeleteFlag } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsInt } from "class-validator";

export class DeleteMessageDto {
  @Expose()
  @IsInt()
  messageId: number;

  @Expose()
  @IsEnum(MessageDeleteFlag)
  deleteFlag: MessageDeleteFlag;
}
