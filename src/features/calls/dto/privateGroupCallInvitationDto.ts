import { Expose } from "class-transformer";
import { IsArray, IsInt, IsPhoneNumber } from "class-validator";

export class PrivateGroupCallInvitationDto {
  @Expose()
  @IsArray()
  @IsPhoneNumber(undefined, { each: true })
  usersToAdd: string[];


  @Expose()
  @IsInt()
  callRoomId:number;
}
