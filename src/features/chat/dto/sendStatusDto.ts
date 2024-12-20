import { IsIn, IsInt } from "class-validator";

export class SendStatusDto {
  @IsIn(["online", "typing", "recording"])
  status: "online" | "typing" | "recording";

  @IsInt()
  recipientId: number;
}
