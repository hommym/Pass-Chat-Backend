import { IsOptional } from "class-validator";

export class UserLoginResponseDto {
  phone: string;

  fullName?: string;

  username?: string;

  bio?: string;

  profile?: string;
}
