import { IsNotEmpty, IsPhoneNumber } from "class-validator";

export class UserLoginDto {
  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty()
  fullName: string;
}
