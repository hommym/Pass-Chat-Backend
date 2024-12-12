import { AccountType } from "@prisma/client";
import { appEvents, database, randomData } from "../../common/constants/objects";
import { UserLoginDto } from "./dtos/userLoginDto";
import { AdminLoginDto } from "./dtos/adminLoginDto";
import { AppError } from "../../common/middlewares/errorHandler";
import { plainToInstance } from "class-transformer";
import { UserLoginResponseDto } from "./dtos/userLoginResponseDto";
import { jwtForLogIn, jwtForOtp, verifyJwtToken } from "../../common/libs/jwt";
import { JwtPayload } from "jsonwebtoken";
import { UpdateUserAccountDto } from "./dtos/updateUserAccountDto";
import { UpdateAdminAccountDto } from "./dtos/updateAdminAccountDto";
import { ChangePasswordDto } from "./dtos/changePasswordDto";
import { encryptData, verifyEncryptedData } from "../../common/libs/bcrypt";
import { CreateAdminDto } from "./dtos/createAdminDto";
import { AdminLoginResponseDto } from "./dtos/adminLoginResponseDto";

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

  async createAdminAccount(accountDetails: CreateAdminDto, superAdminId: number) {
    //check cleint if he is a superAdmin
    const { email, role } = accountDetails;
    const superAdminInfo = await database.user.findUnique({ where: { id: superAdminId } });

    if (superAdminInfo!.role !== "superAdmin") throw new AppError("Not Authorize to create this accounts", 401);

    // create password
    const plainPassword = randomData.string(5);
    const password = await encryptData(plainPassword);
    // creat account
    await database.user.upsert({ where: { email }, create: { email, password, role }, update: {} });
    // send email
    appEvents.emit("registration-email", { email, password: plainPassword });
    return { message: "Account Created Sucessfully" };
  }

  async login(type: AccountType, loginDto: UserLoginDto | AdminLoginDto) {
    if (type === "user") {
      const { fullName, phone } = loginDto as UserLoginDto;
      const accountDetails = await this.createUserAccount(phone, fullName);
      return {
        account: plainToInstance(UserLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
        authToken: jwtForLogIn(accountDetails.id),
      };
    } else {
      const { email, password } = loginDto as AdminLoginDto;
      const accountDetails = await this.checkAccount(email);
      if (!accountDetails) throw new AppError(`No Account with ${email} exist`, 404);
      await verifyEncryptedData(password, accountDetails.password as string);

      if (await this.check2FAuth(accountDetails.id)) {
        return {
          account: plainToInstance(AdminLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
          is2FAEnabled: true,
        };
      }

      return { account: plainToInstance(AdminLoginResponseDto, accountDetails, { excludeExtraneousValues: true }), authToken: jwtForLogIn(accountDetails.id), is2FAEnabled: false };
    }
  }

  async set2FAOtp(otp: number | null, userId: number) {
    await database.twoFactorAuth.upsert({ where: { userId }, create: { userId }, update: { otpCode: otp ? jwtForOtp(otp as number) : null } });
  }

  async activateOrDeactivate2FA(action: "activate" | "deactivate", userId: number) {
    if (action === "activate") {
      await this.set2FAOtp(null, userId);
      return { message: "2FA activated sucessfully" };
    } else {
      await database.twoFactorAuth.delete({ where: { userId } });
      return { message: "2FA deactivated sucessfully" };
    }
  }

  async send2FAOtp(email: string) {
    const accountDetails = await this.checkAccount(email);

    if (!accountDetails) throw new AppError(`No account with ${email} exist`, 404);
    else if (!(await this.check2FAuth(accountDetails.id))) throw new AppError(`This account does not have 2FA activated`, 402);

    //create otp
    const otp = randomData.num(1000, 9999);
    //save in database
    await this.set2FAOtp(otp, accountDetails.id);
    //send  email with otp
    appEvents.emit("login-otp-email", { email: accountDetails.email as string, expiryTime: "3", otpCode: otp, username: accountDetails.username as string });

    return { message: "Otp code sent" };
  }

  async verify2FAOtp(otp: number, email: string) {
    const accountDetails = await this.checkAccount(email);
    if (!accountDetails) throw new AppError(`No account with ${email} exist`, 404);
    const otpInfo = await this.check2FAuth(accountDetails.id);
    if (!otpInfo) throw new AppError(`This account does not have 2FA activated`, 402);
    else if (!otpInfo.otpCode) throw new AppError("No otp code has been sent", 402);
    try {
      const { otpCode } = verifyJwtToken(otpInfo.otpCode) as JwtPayload;
      if (otpCode !== otp) throw new AppError("Wrong Otp code entered,check code", 402);
      return { authToken: jwtForLogIn(accountDetails.id) };
    } catch (error) {
      throw new AppError("Otp code has expired ,please request for another code", 402);
    }
  }

  async updateAccount(type: AccountType, updatedData: UpdateUserAccountDto | UpdateAdminAccountDto, userId: number) {
    const oldInfo = await database.user.findUnique({ where: { id: userId } });
    if (type === "user" && oldInfo!.type !== "user") throw new AppError("Account been updated must be an user account", 401);
    else if (type === "admin" && oldInfo!.type !== "admin") throw new AppError("Account been updated must be an admin account", 401);
    await database.user.upsert({ where: { id: userId }, create: {}, update: updatedData });
    return { message: "Account Updated sucessfull" };
  }

  async changePassword(updatedData: ChangePasswordDto, userId: number) {
    const { oldPassword, newPassword } = updatedData;
    const oldInfo = await database.user.findUnique({ where: { id: userId } });
    if (oldInfo!.type !== "admin") throw new AppError("Only Admin Accounts can chang passwords", 401);
    await verifyEncryptedData(oldPassword, oldInfo!.password as string);

    await database.user.upsert({ where: { id: userId }, create: {}, update: { password: await encryptData(newPassword) } });
    return { message: "Password Changed sucessfully" };
  }
}
