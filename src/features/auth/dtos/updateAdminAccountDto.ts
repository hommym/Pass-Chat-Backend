import { IsBase64, IsNotEmpty, } from "class-validator";

export class UpdateAdminAccountDto {
  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  username: string;

  @IsBase64()
  profile: string;
}
