import { Expose } from "class-transformer";
import { IsInt, IsPhoneNumber } from "class-validator";

export class PrivateGroupCallDto {
  @Expose()
  @IsPhoneNumber()
  existingUserPhone: string;
}
