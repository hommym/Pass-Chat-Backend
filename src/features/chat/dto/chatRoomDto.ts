import { Expose } from "class-transformer";
import { IsPhoneNumber } from "class-validator";





export class ChatRoomDto {
  @Expose()
  @IsPhoneNumber()
  user1Phone: string;

  @Expose()
  @IsPhoneNumber()
  user2Phone: string;
}