import { flaggedContent, flagReason } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsPhoneNumber } from "class-validator";

export class SubmitReportDto {
  @Expose()
  @IsEnum(flaggedContent)
  type: flaggedContent;

  @Expose()
  @IsEnum(flagReason)
  reason: flagReason;

  @Expose()
  @IsInt()
  @IsOptional()
  messageId?: number;

  @Expose()
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @Expose()
  @IsInt()
  @IsOptional()
  communityId?: number;
}
