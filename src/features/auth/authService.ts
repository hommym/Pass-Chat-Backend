import { AccountType, NotificationAction, User } from "@prisma/client";
import { appEvents, database, randomData } from "../../common/constants/objects";
import { UserLoginDto } from "./dtos/userLoginDto";
import { AdminLoginDto } from "./dtos/adminLoginDto";
import { AppError } from "../../common/middlewares/errorHandler";
import { plainToInstance } from "class-transformer";
import { UserLoginResponseDto } from "./dtos/userLoginResponseDto";
import { jwtForLogIn, jwtForOtp, jwtForWsConnectionId, verifyJwtToken } from "../../common/libs/jwt";
import { JwtPayload } from "jsonwebtoken";
import { UpdateUserAccountDto } from "./dtos/updateUserAccountDto";
import { UpdateAdminAccountDto } from "./dtos/updateAdminAccountDto";
import { ChangePasswordDto } from "./dtos/changePasswordDto";
import { encryptData, verifyEncryptedData } from "../../common/libs/bcrypt";
import { CreateAdminDto } from "./dtos/createAdminDto";
import { AdminLoginResponseDto } from "./dtos/adminLoginResponseDto";
import { Socket } from "socket.io";
import qrCodeGen from "qrcode";
import { authRouterWs } from "./ws/authHandler";
import { ChangePhoneDto } from "./dtos/changePhoneDto";
import { chatRouterWs } from "../chat/ws/chatHandler";
import { Verify2FAOtpDto } from "./dtos/verify2FAOtpDto";
import { getCurrentDate } from "../../common/helpers/date";

export class AuthService {
  async checkAccount(email: string) {
    return await database.user.upsert({ where: { email }, create: {}, update: { recentLoginDate: getCurrentDate() } });
  }

  async createUserAccount(phone: string) {
    return await database.user.upsert({ where: { phone }, create: { phone, recentLoginDate: getCurrentDate() }, update: { recentLoginDate: getCurrentDate() } });
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
    await database.user.upsert({ where: { email }, create: { email, password, role, type: "admin" }, update: { password } });
    // send email
    appEvents.emit("registration-email", { email, password: plainPassword });
    return { message: "Account Created Sucessfully" };
  }

  async login(type: AccountType, loginDto: UserLoginDto | AdminLoginDto) {
    if (type === "user") {
      const { phone } = loginDto as UserLoginDto;
      const accountDetails = await this.createUserAccount(phone);
      if (accountDetails.loggedIn) throw new AppError("User Has Already logged In Another Device", 401);
      await database.user.update({ where: { phone }, data: { loggedIn: true } });
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

  async logout(userId: number, isWebLogout: boolean = false) {
    if (isWebLogout) {
      await database.user.update({ where: { id: userId }, data: { webLoggedIn: false } });
    } else {
      await database.user.update({ where: { id: userId }, data: { loggedIn: false, onlineStatus: "offline" } });
    }
    return { message: "User Logged Out Successfully" };
  }

  async webLogin(loginDto: UserLoginDto) {
    const { phone } = loginDto;

    const accountDetails = await database.user.findUnique({ where: { phone } });
    if (!accountDetails) throw new AppError("No Account with this number exist", 404);
    else if (accountDetails.webLoggedIn) throw new AppError("WebApp Already loggedIn", 401);

    await database.user.update({ where: { id: accountDetails.id }, data: { webLoggedIn: true } });
    await this.sendOtpForWeb(accountDetails);
    return {
      account: plainToInstance(UserLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
      message: "Enter the Otp code sent to your mobile paschat app.",
    };
  }

  async webQrCodeLogin(encryptId: string, userId: number) {
    try {
      const jwtData = verifyJwtToken(encryptId) as JwtPayload;
      const webClientConnection = authRouterWs.sockets.get(jwtData.connectionId);
      if (webClientConnection) {
        const accountDetails = await database.user.findUnique({ where: { id: userId } });
        if (accountDetails!.webLoggedIn) throw new AppError("WebApp Already loggedIn", 401);
        webClientConnection.emit("response", {
          action: "webQrCodeLogin",
          account: plainToInstance(UserLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
          authToken: jwtForLogIn(accountDetails!.id),
        });

        await database.user.update({ where: { id: accountDetails!.id }, data: { webLoggedIn: true } });
      }
      return { message: "Login Sucessfull" };
    } catch (error) {
      throw new AppError(error instanceof AppError ? error.message : "Web Login Session has expired or is not valid", 401);
    }
  }

  async set2FAOtp(otp: number | null, userId: number) {
    return await database.twoFactorAuth.upsert({ where: { userId }, create: { userId }, update: { otpCode: otp ? jwtForOtp(otp as number) : null } });
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

  async sendOtpForWeb(accountDetails: User | null, phone: string | undefined = undefined) {
    // set for otp for account
    const otpCode = randomData.num(1000, 9999);
    const account = accountDetails ? accountDetails : await database.user.findUnique({ where: { phone } });

    if (!account) throw new AppError("No account with this phone exist", 404);

    const twoAuthDetails = await this.set2FAOtp(otpCode, account.id);

    //send otp in app
    if (account.onlineStatus === "online") {
      const userConnection = chatRouterWs.sockets.get(account.connectionId!);
      if (userConnection) {
        userConnection.emit("response", { action: "recieveOtp", otpCode });

        // return { message: "OtpCode sent sucessfully , check paschat app for otp." };
      }
    }
    // for when user is offline set notification
    // await database.notification.upsert({
    //   where: { twoFactorAuthId: twoAuthDetails.id },
    //   create: { platform: "mobile", twoFactorAuthId: twoAuthDetails.id, data: { otpCode }, userId: account.id, action: "showOtpCode" },
    //   update: { data: { otpCode } },
    // });
    return { message: "OtpCode sent sucessfully , check paschat app for otp." };
  }

  async verify2FAOtp(verify2FADto: Verify2FAOtpDto, type: "admin" | "user" = "admin") {
    const { email, phone } = verify2FADto;
    let accountDetails: User | null;

    if (type === "admin") {
      accountDetails = await this.checkAccount(email);
      if (!accountDetails) throw new AppError(`No account with ${email} exist`, 404);
    } else {
      accountDetails = await database.user.findUnique({ where: { phone } });
      if (!accountDetails) throw new AppError(`No account with ${phone} exist`, 404);
    }

    const otpInfo = await this.check2FAuth(accountDetails.id);
    if (!otpInfo) throw new AppError(`This account does not have 2FA activated`, 401);
    else if (!otpInfo.otpCode) throw new AppError("No otp code has been sent", 401);
    try {
      const { otpCode } = verifyJwtToken(otpInfo.otpCode) as JwtPayload;
      if (otpCode !== verify2FADto.otpCode) throw new AppError("Wrong Otp code entered,check code", 401);
      if (type === "user") await database.twoFactorAuth.update({ where: { id: otpInfo.id }, data: { otpCode: null } });
      return { authToken: jwtForLogIn(accountDetails.id) };
    } catch (error) {
      throw new AppError(error instanceof AppError ? error.message : "Otp code has expired ,please request for another code", 401);
    }
  }

  async updateAccount(type: AccountType, updatedData: UpdateUserAccountDto | UpdateAdminAccountDto, userId: number) {
    const oldInfo = await database.user.findUnique({ where: { id: userId } });
    if (type === "user" && oldInfo!.type !== "user") throw new AppError("Account been updated must be an user account", 401);
    else if (type === "user" && (updatedData as UpdateUserAccountDto).email) {
      const details = await database.user.findUnique({ where: { email: (updatedData as UpdateUserAccountDto).email } });
      if (details) throw new AppError("An Account with this email exist", 404);
    } else if (type === "admin" && oldInfo!.type !== "admin") throw new AppError("Account been updated must be an admin account", 401);
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

  async changePhoneNumber(userId: number, changePhoneDto: ChangePhoneDto) {
    const { newPhone, oldPhone } = changePhoneDto;

    const isThereAccountWithNewPhone = await database.user.findUnique({ where: { phone: newPhone } });

    if (isThereAccountWithNewPhone) throw new AppError(`This phone ${newPhone} is already associated with account,please change the new phone number and try again`, 409);

    const account = await database.user.findUnique({ where: { id: userId, phone: oldPhone } });

    if (!account) throw new AppError(`This phone ${oldPhone} is not associated with this account`, 404);

    await database.user.update({ where: { id: userId, phone: oldPhone }, data: { phone: newPhone } });

    const usersWithOldContact = await database.userContact.findMany({ where: { phone: oldPhone } });
    await database.userContact.updateMany({ where: { phone: oldPhone }, data: { phone: newPhone } });

    const notificationsData = usersWithOldContact.map((contact) => {
      return { userId: contact.ownerId, data: { newPhone, oldPhone }, action: "phoneChange" as NotificationAction };
    });
    await database.notification.createMany({ data: notificationsData });
    return { nessage: `Phone has beeen changed sucessfully from ${oldPhone} to ${newPhone}` };
  }

  async createLoginQrCode(socket: Socket) {
    const qrCode = await qrCodeGen.toDataURL(jwtForWsConnectionId(socket.id));
    socket.emit("response", { action: "createLoginQrCode", qrCode });
  }
}
