import { CallType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class SendSdpOfferDto {
  @Expose()
  @IsInt()
  roomId: number;

  @Expose()
  @IsPhoneNumber()
  recipientPhone: string;

  @Expose()
  @IsEnum(CallType)
  callType: CallType;

  @Expose()
  @IsString()
  @IsNotEmpty()
  sdpOffer: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isGroupCall?: boolean;
}
