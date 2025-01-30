import { Expose } from "class-transformer";
import { IsArray, IsEmail, IsInt, IsOptional, IsString, IsUrl } from "class-validator";




export class VerifyCommunityDto {
  @Expose()
  @IsInt()
  communityId: number;

  @Expose()
  @IsString()
  reason: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @Expose()
  @IsArray()
  @IsUrl({}, { each: true })
  otherSocials: string[];

  @Expose()
  @IsArray()
  @IsUrl({}, { each: true })
  supportingDocs: string[];

  @Expose()
  @IsEmail()
  contact: string;
}