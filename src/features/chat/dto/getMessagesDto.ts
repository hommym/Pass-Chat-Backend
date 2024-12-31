import { Expose } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Matches, Validate } from "class-validator";
import { IsTimeZoneValid } from "../../../common/helpers/classes/isValidTimeZone";

export class GetMessagesDto {
  @Expose()
  @IsInt()
  chatRoomId: number;

  @Expose()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD",
  })
  date: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @Validate(IsTimeZoneValid)
  timeZone: string;
}
