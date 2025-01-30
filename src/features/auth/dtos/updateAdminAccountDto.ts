import { Expose } from "class-transformer";
import { IsBase64, IsNotEmpty, IsOptional } from "class-validator";

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
  @IsBase64()
  profile?: string;
}
