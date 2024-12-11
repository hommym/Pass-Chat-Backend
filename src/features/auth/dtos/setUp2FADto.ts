import { IsIn } from "class-validator";

export class Setup2FADto {
  @IsIn(["activate", "deactivate"])
  action: "activate" | "deactivate";
}
