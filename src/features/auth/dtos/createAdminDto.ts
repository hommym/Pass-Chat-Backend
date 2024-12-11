import { AdminRoles } from "@prisma/client";
import { IsEmail, IsEnum } from "class-validator";

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsEnum(AdminRoles)
  role: AdminRoles;
}
