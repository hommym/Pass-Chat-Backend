import { Expose } from "class-transformer";
import { IsBoolean, IsInt, IsOptional } from "class-validator";

export class ClearChatDto {
  @Expose()
  @IsInt()
  chatRoomId: number;

  @Expose()
  @IsOptional()
  @IsBoolean()
  forAll?: boolean;
}
