import { Expose } from "class-transformer";
import {  IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateAdminAccountDto {
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
  @IsString()
  @IsNotEmpty()
  profile?: string;
}
