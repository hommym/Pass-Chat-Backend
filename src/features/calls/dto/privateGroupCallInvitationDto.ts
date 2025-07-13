import { CallType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsArray, IsEmpty, IsEnum, IsInt, IsOptional, IsPhoneNumber } from "class-validator";

export class PrivateGroupCallInvitationDto {
  @Expose()
  @IsArray()
  @IsPhoneNumber(undefined, { each: true })
  usersToAdd: string[];

  @Expose()
  @IsInt()
  callRoomId: number;

  @Expose()
  @IsOptional()
  @IsEnum(CallType)
  callType?: CallType;
}
