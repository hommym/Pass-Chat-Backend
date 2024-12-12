import { AdminRoles } from "@prisma/client";
import { Expose } from "class-transformer";

export class AdminLoginResponseDto {
  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  fullName: string;

  @Expose()
  profile: string;

  @Expose()
  role: AdminRoles;
}
