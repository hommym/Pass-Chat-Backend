import { Expose } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsPhoneNumber, IsPositive } from "class-validator";

export class Verify2FAOtpDto {
  @Expose()
  @IsOptional()
  @IsEmail()
  email: string;

  @Expose()
  @IsOptional()
  @IsPhoneNumber()
  phone: string;

  @Expose()
  @IsInt()
  @IsPositive()
  otpCode: number;
}
