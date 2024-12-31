import { Expose } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsPositive } from "class-validator";

export class MessageDto {
  @Expose()
  @IsNotEmpty()
  content: string;

  @Expose()
  @IsIn(["text", "video", "audio", "image"])
  dataType: "text" | "video" | "audio" | "image";
  
  @Expose()
  @IsInt()
  roomId: number;

  @Expose()
  @IsPositive()
  senderId: number;

  @Expose()
  @IsPositive()
  recipientId: number;
}
