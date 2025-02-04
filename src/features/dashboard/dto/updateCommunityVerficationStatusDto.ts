import { Expose } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateCommunityVerificationStatus {
  @Expose()
  @IsInt()
  verificationRequestId: number;

  @Expose()
  @IsIn(["accept", "decline"])
  action: "accept" | "decline";

  @Expose()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
