import { Expose } from "class-transformer";
import { IsArray } from "class-validator";

export class SavedContactsDto {
  @Expose()
  @IsArray()
  contacts: Array<string>;
}
