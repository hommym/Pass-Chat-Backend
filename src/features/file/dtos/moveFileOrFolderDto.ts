import { Expose } from "class-transformer";
import { IsInt } from "class-validator";


export class MoveFileOrFolderDto {
  @Expose()  
  @IsInt()
  itemId: number;

  @Expose()
  @IsInt()
  parentFolderId: number;
}