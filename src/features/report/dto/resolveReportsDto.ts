import { Expose } from "class-transformer";
import { IsIn, IsInt } from "class-validator";

export class ResolveReportDto {
  @Expose()
  @IsInt()
  flaggedDataId: number;

  @Expose()
  @IsIn(["approved", "declined"])
  action: "approved" | "declined";
}
