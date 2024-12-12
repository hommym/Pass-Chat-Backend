import { Expose } from "class-transformer";
import { IsNotEmpty } from "class-validator";


export class ChangePasswordDto {
  @Expose()
  @IsNotEmpty()
  oldPassword: string;

  @Expose()
  @IsNotEmpty()
  newPassword: string;
}