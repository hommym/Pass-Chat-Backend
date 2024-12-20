import { IsIn, IsInt } from "class-validator";



export class NotifySenderDto {
  @IsIn(["recieved", "read"])
  action: "recieved" | "read";

  @IsInt()
  messageId: number;
}
