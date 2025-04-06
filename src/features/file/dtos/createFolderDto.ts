import { Expose } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";



export class CreateFolderDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsOptional()
  @IsInt()
  parentFolderId?: number;
}