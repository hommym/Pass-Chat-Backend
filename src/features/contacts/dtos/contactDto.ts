import { Expose } from "class-transformer";
import { IsString, IsPhoneNumber, IsOptional } from "class-validator";

export class ContactDto {
  @Expose()
  @IsOptional()
  @IsString()
  contactName: string|null;

  @Expose()
  @IsPhoneNumber()
  phone: string;
}