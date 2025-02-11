import { OnlineStatus } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsPhoneNumber } from "class-validator";

export class SetStatusDto {
  @Expose()
  @IsEnum(OnlineStatus)
  status: OnlineStatus;

  @Expose()
  @IsInt()
  roomId: number;
}
