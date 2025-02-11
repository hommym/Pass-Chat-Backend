import { Expose } from "class-transformer";
import { IsInt, IsPhoneNumber } from "class-validator";

export class CheckStatusDto {
  @Expose()
  @IsPhoneNumber()
  phone: string;

  @Expose()
  @IsInt()
  roomId: number;
}
