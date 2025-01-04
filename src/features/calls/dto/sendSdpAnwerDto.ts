import { Expose } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class SendSdpAnswerDto {
  @Expose()
  @IsInt()
  callerId: number;

  @Expose()
  @IsString()
  sdpAnswer: string;
}
