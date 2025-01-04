import { CallType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";

export class SendSpdOfferDto {
  @Expose()
  @IsInt()
  roomId: number;
  @IsPhoneNumber()
  recipientPhone: string;

  @IsEnum(CallType)
  callType:CallType;

  @IsString()
  @IsNotEmpty()
  sdpOffer: string;
}
