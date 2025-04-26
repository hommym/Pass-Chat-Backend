import { PostType } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class CreateStoryDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Expose()
  @IsEnum(PostType)
  postType: PostType;

  @Expose()
  @IsOptional()
  @IsArray()
  @IsPhoneNumber(undefined, { each: true })
  exclude?: string[];
}
