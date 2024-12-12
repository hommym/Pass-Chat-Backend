import { Expose } from "class-transformer";
import { IsIn } from "class-validator";

export class Setup2FADto {
  @Expose()
  @IsIn(["activate", "deactivate"])
  action: "activate" | "deactivate";
}
