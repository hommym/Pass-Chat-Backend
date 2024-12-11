import { IsEmail, IsInt, IsPositive } from "class-validator";

export class Verify2FAOtpDto {
  @IsEmail()
  email: string;

  @IsInt()
  @IsPositive()
  otpCode: number;
}
