import { CommunityPermissionsLevels } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsIn } from "class-validator";




export class Permissions {
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