import { Expose } from "class-transformer";
import {  IsDateString, IsIn, IsNotEmpty, Matches } from "class-validator";

export class UploadFileDto {
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
  @IsIn(["video", "image", "audio","doc"])
  mediaType: "video" | "image" | "audio"|"doc";
}
