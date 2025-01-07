import { CommunityVisibility } from "@prisma/client";
import { Expose, Type } from "class-transformer";
import { IsBase64, IsEnum, IsInstance, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Permissions } from "./permissionsDto";

export class CreateCommunityDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Expose()
  @IsEnum(CommunityVisibility)
  visibility: CommunityVisibility;

  @Expose()
  @IsOptional()
  @IsString()
  @IsBase64()
  profile?: string;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => Permissions)
  permissions?: Permissions;
}
