import { CommunityVisibility } from "@prisma/client";
import { Expose, Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
  @IsNotEmpty()
  profile?: string;
}
