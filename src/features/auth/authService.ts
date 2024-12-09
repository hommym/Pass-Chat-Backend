import { AccountType } from "@prisma/client";
import { database } from "../../common/constants/objects";
import { UserLoginDto } from "./dtos/userLoginDto";
import { AdminLoginDto } from "./dtos/adminLoginDto";
import { AppError } from "../../common/middlewares/errorHandler";
import { plainToInstance } from "class-transformer";
import { UserLoginResponseDto } from "./dtos/userLoginResponseDto";
import { jwtForLogIn } from "../../common/libs/jwt";

export class AuthService {
  async checkAccount(email: string) {
    return await database.user.findUnique({ where: { email } });
  }

  async createUserAccount(phone: string, fullName: string) {
    return await database.user.upsert({ where: { phone }, create: { phone, fullName }, update: {} });
  }

  async check2FAuth(userId: number) {
    return database.twoFactorAuth.findUnique({ where: { userId } });
  }

  async login(type: AccountType, loginDto: UserLoginDto | AdminLoginDto) {
    if (type === "user") {
      const { fullName, phone } = loginDto as UserLoginDto;
      const accountDetails = await this.createUserAccount(phone, fullName);
      return {
        account: plainToInstance(UserLoginResponseDto, accountDetails),
        authToken: jwtForLogIn(accountDetails.id),
      };
    } else {
      const { email, password } = loginDto as AdminLoginDto;
      const accountDetails = await this.checkAccount(email);
      if (!accountDetails) throw new AppError(`No Account with ${email} exist`, 404);

      if (await this.check2FAuth(accountDetails.id)) {
        return {
          account: accountDetails,
          is2FAEnabled: true,
        };
      }

      return { account: accountDetails, authToken: jwtForLogIn(accountDetails.id), is2FAEnabled: false };
    }
  }
}
