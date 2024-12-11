import { IsBase64, IsNotEmpty, IsPhoneNumber } from "class-validator";

export class UpdateUserAccountDto {

  @IsNotEmpty()  
  fullName:string

  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  bio: string;

  @IsBase64()
  profile: string;
}
