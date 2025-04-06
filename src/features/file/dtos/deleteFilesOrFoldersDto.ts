import { Expose } from "class-transformer";
import { IsArray, IsInt } from "class-validator";

export class DeleteFileOrFolderDto {
  @Expose()
  @IsArray()
  @IsInt({ each: true })
  itemIds: number[];
}
