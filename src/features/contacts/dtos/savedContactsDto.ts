import { Expose, Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { ContactDto } from "./contactDto";

export class SavedContactsDto {
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts: ContactDto[];
}
