import { Expose } from "class-transformer";
import { IsPhoneNumber } from "class-validator";

export class ChangePhoneDto {
  @IsPhoneNumber()
  @Expose()
  oldPhone: string;

  @Expose()
  @IsPhoneNumber()
  newPhone: string;
}