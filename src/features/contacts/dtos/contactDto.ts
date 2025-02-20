import { Expose } from "class-transformer";
import { IsString, IsPhoneNumber } from "class-validator";

export class ContactDto {
  @Expose()
  @IsString()
  contactName: string;

  @Expose()
  @IsPhoneNumber()
  phone: string;
}