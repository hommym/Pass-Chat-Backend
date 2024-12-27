import { Expose } from "class-transformer";
import { IsNotEmpty, IsPhoneNumber } from "class-validator";

export class UserLoginDto {
  @Expose()
  @IsPhoneNumber()
  phone: string;
}
