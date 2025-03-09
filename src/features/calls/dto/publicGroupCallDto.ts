import { CallType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsInt } from "class-validator";

export class PublicGroupCallDto {
  @Expose()
  @IsInt()
  communityId: number;

  @Expose()
  @IsEnum(CallType)
  callType: "audio" | "video";
}
