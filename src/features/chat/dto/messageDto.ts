import { MessageType, RoomType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive } from "class-validator";

export class MessageDto {
  @Expose()
  @IsNotEmpty()
  content: string;

  @Expose()
  @IsEnum(MessageType)
  dataType: MessageType;

  @Expose()
  @IsInt()
  roomId: number;

  @Expose()
  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @Expose()
  @IsPositive()
  senderId: number;

  @Expose()
  @IsPositive()
  @IsOptional()
  recipientId?: number;

  @Expose()
  @IsInt()
  @IsOptional()
  replyTo?: number;

  @Expose()
  @IsInt()
  @IsOptional()
  communityId?: number;
}
