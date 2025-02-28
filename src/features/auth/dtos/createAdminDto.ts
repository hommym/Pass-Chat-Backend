import { AdminRoles } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEmail, IsEnum } from "class-validator";

export class CreateAdminDto {
  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  @IsEnum(AdminRoles)
  role: AdminRoles;
}
