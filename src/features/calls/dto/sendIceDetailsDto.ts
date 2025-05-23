import { Expose } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class SendIceDetailsDto {
  @Expose()
  @IsInt()
  recipientId: number;

  @Expose()
  @IsString()
  iceDetails: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isGroupCall?: boolean;
}
