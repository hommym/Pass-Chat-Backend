import { Expose } from "class-transformer";
import { IsBase64, IsNotEmpty, IsOptional, IsPhoneNumber } from "class-validator";

export class UpdateUserAccountDto {
  @Expose()
  @IsOptional()
  @IsNotEmpty()
  fullName?: string;

  @Expose()
  @IsOptional()
  @IsNotEmpty()
  username?: string;

  @Expose()
  @IsOptional()
  @IsNotEmpty()
  bio?: string;

  @Expose()
  @IsOptional()
  @IsBase64()
  profile?: string;
}