import { Expose } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class SendIceDetailsDto {
  @Expose()
  @IsInt()
  recipientId: number;  

  @Expose()
  @IsString()
  iceDetails: string;
}
