import { Expose } from "class-transformer";
import { IsEmail, IsInt, IsPositive } from "class-validator";

export class Verify2FAOtpDto {
  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  @IsInt()
  @IsPositive()
  otpCode: number;
}
