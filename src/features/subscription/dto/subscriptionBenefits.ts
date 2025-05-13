import { Expose } from "class-transformer";
import { IsBoolean, IsInt } from "class-validator";

export class SubScriptionBenefits {
  @Expose()
  @IsInt()
  maxFilesSizePerDay: number;

  @Expose()
  @IsInt()
  maxFilesSizePerUpload: number;

  @Expose()
  @IsInt()
  maxFoldersCount: number;

  @Expose()
  @IsInt()
  maxOwnedCommunities: number;

  @Expose()
  @IsInt()
  maxMembersPerGroup: number;

  @Expose()
  @IsInt()
  maxMembersPerChannel: number;


  @Expose()
  @IsBoolean()
  avatarProfile: boolean;

  @Expose()
  @IsInt()
  maxMessageSchedules: number;
}
