import { Expose } from "class-transformer";
import { IsPhoneNumber } from "class-validator";

export class CheckStatusDto {
  @Expose()
  @IsPhoneNumber()
  phone: string;
}
