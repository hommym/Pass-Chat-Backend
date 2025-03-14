import { Expose } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class SendSdpAnswerDto {
  @Expose()
  @IsInt()
  callerId: number;

  @Expose()
  @IsString()
  sdpAnswer: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isGroupCall?: boolean;
}
