import { CallType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsPhoneNumber } from "class-validator";

export class PrivateGroupCallDto {
  @Expose()
  @IsPhoneNumber()
  existingUserPhone: string;

  @Expose()
  @IsOptional()
  @IsEnum(CallType)
  callType?:CallType
}
