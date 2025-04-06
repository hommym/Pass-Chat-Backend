import { Expose } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class RenameFileOrFolderDto {
  @Expose()
  @IsInt()
  itemId: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  newName: string;
}
