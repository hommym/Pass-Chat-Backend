import { CallType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

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
}
