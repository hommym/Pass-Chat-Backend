import { Expose } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class SaveFileInFolderDto {
  @Expose()
  @IsNotEmpty()
  @Matches(/^[^\\/:\*\?"<>\|]+?\.[a-zA-Z0-9]+$/, {
    message: 'The filename must be in the format "filename.extension"',
  })
  fileName: string;

  @Expose()
  @IsDateString()
  date: string;

  @Expose()
  @IsIn(["video", "image", "audio", "doc"])
  mediaType: "video" | "image" | "audio" | "doc";

  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  parentFolderId?: string;
}
