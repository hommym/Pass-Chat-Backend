import { CommunityPermissionsLevels } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsBoolean, IsEnum, IsIn, IsNotEmpty, IsString } from "class-validator";

export class GroupPermissionsDto {
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

  @Expose()
  @IsBoolean()
  prevMessage: boolean;
}

export class ChannelPermissionDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsEnum(CommunityPermissionsLevels)
  commenting: CommunityPermissionsLevels;

  @Expose()
  @IsEnum(CommunityPermissionsLevels)
  communitySharing: CommunityPermissionsLevels;
}
