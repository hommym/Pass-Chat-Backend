import { Expose } from "class-transformer";
import { IsIn, IsPhoneNumber } from "class-validator";

export class BlockContactDto {
  @Expose()
  @IsPhoneNumber()
  phone: string;

  @Expose()
  @IsIn(["block", "unblock"])
  action: "block" | "unblock";
}
