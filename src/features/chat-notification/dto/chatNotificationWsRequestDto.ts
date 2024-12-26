import { RoomType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsIn, IsNotEmptyObject, IsOptional } from "class-validator";

export class ChatNotificationWsRequestDto {
  @Expose()
  @IsIn(["setNotification", "getNotification"])
  action: "setNotification" | "getNotification";

  @Expose()
  @IsOptional()
  @IsEnum(RoomType)
  chatType?: RoomType;

  @Expose()
  @IsOptional()
  @IsNotEmptyObject()
  data: object;
}
