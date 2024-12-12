import { Expose } from "class-transformer";
import { IsEmail, IsNotEmpty } from "class-validator";

export class AdminLoginDto {
  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  @IsNotEmpty()
  password: string;
}
