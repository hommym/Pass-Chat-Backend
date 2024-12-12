import { Expose } from "class-transformer";


export class UserLoginResponseDto {
  @Expose()
  phone: string;

  @Expose()
  fullName?: string;

  @Expose()
  username?: string;

  @Expose()
  bio?: string;

  @Expose()
  profile?: string;
}
