import { CommunityRole } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsNumber, IsPhoneNumber } from "class-validator";

export class UpdateRoleDto {
  @Expose()
  @IsNumber()
  communityId: number;

  @Expose()
  @IsPhoneNumber()
  memberPhone: string;

  @Expose()
  @IsEnum(CommunityRole)
  newRole: CommunityRole;
}
