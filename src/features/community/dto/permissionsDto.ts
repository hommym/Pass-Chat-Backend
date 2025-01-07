import { CommunityPermissionsLevels } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsIn, IsNotEmpty, IsString } from "class-validator";

export class PermissionsDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsEnum(CommunityPermissionsLevels)
  messaging: CommunityPermissionsLevels;

  @Expose()
  @IsEnum(CommunityPermissionsLevels)
  mediaSharing: CommunityPermissionsLevels;

  @Expose()
  @IsEnum(CommunityPermissionsLevels)
  communitySharing: CommunityPermissionsLevels;

  @Expose()
  @IsEnum(CommunityPermissionsLevels)
  polls: CommunityPermissionsLevels;

  @Expose()
  @IsEnum(CommunityPermissionsLevels)
  pinning: CommunityPermissionsLevels;
}
