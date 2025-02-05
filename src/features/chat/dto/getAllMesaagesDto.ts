import { Expose } from "class-transformer";
import { IsInt } from "class-validator";

export class GetAllMessagesDto {
  @Expose()
  @IsInt()
  chatRoomId: number;
}
