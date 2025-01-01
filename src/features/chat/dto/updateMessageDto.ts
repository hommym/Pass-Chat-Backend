import { Expose } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";



export class UpdateMessageDto {
  @Expose()
  @IsInt()
  messageId: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  newMessage: string;
}