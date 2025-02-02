"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const class_transformer_1 = require("class-transformer");
const userLoginResponseDto_1 = require("./dtos/userLoginResponseDto");
const jwt_1 = require("../../common/libs/jwt");
const bcrypt_1 = require("../../common/libs/bcrypt");
const adminLoginResponseDto_1 = require("./dtos/adminLoginResponseDto");
const qrcode_1 = __importDefault(require("qrcode"));
const authHandler_1 = require("./ws/authHandler");
class AuthService {
    async checkAccount(email) {
        return await objects_1.database.user.findUnique({ where: { email } });
    }
    async createUserAccount(phone) {
        return await objects_1.database.user.upsert({ where: { phone }, create: { phone }, update: {} });
    }
    async check2FAuth(userId) {
        return objects_1.database.twoFactorAuth.findUnique({ where: { userId } });
    }
    async createAdminAccount(accountDetails, superAdminId) {
        //check cleint if he is a superAdmin
        const { email, role } = accountDetails;
        const superAdminInfo = await objects_1.database.user.findUnique({ where: { id: superAdminId } });
        if (superAdminInfo.role !== "superAdmin")
            throw new errorHandler_1.AppError("Not Authorize to create this accounts", 401);
        // create password
        const plainPassword = objects_1.randomData.string(5);
        const password = await (0, bcrypt_1.encryptData)(plainPassword);
        // creat account
        await objects_1.database.user.upsert({ where: { email }, create: { email, password, role, type: "admin" }, update: { password } });
        // send email
        objects_1.appEvents.emit("registration-email", { email, password: plainPassword });
        return { message: "Account Created Sucessfully" };
    }
    async login(type, loginDto) {
        if (type === "user") {
            const { phone } = loginDto;
            const accountDetails = await this.createUserAccount(phone);
            if (accountDetails.loggedIn)
                throw new errorHandler_1.AppError("User Has Already logged In Another Device", 401);
            await objects_1.database.user.update({ where: { phone }, data: { loggedIn: true } });
            return {
                account: (0, class_transformer_1.plainToInstance)(userLoginResponseDto_1.UserLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
                authToken: (0, jwt_1.jwtForLogIn)(accountDetails.id),
            };
        }
        else {
            const { email, password } = loginDto;
            const accountDetails = await this.checkAccount(email);
            if (!accountDetails)
                throw new errorHandler_1.AppError(`No Account with ${email} exist`, 404);
            await (0, bcrypt_1.verifyEncryptedData)(password, accountDetails.password);
            if (await this.check2FAuth(accountDetails.id)) {
                return {
                    account: (0, class_transformer_1.plainToInstance)(adminLoginResponseDto_1.AdminLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
                    is2FAEnabled: true,
                };
            }
            return { account: (0, class_transformer_1.plainToInstance)(adminLoginResponseDto_1.AdminLoginResponseDto, accountDetails, { excludeExtraneousValues: true }), authToken: (0, jwt_1.jwtForLogIn)(accountDetails.id), is2FAEnabled: false };
        }
    }
    async logout(userId) {
        await objects_1.database.user.update({ where: { id: userId }, data: { loggedIn: false, onlineStatus: "offline" } });
        return { message: "User Logged Out Successfully" };
    }
    async webLogin(loginDto) {
        const { phone } = loginDto;
        const accountDetails = await objects_1.database.user.findUnique({ where: { phone } });
        if (!accountDetails)
            throw new errorHandler_1.AppError("No Account with this number exist", 404);
        else if (!accountDetails.isWebActive)
            await objects_1.database.user.update({ where: { id: accountDetails.id }, data: { isWebActive: true } });
        return {
            account: (0, class_transformer_1.plainToInstance)(userLoginResponseDto_1.UserLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
            authToken: (0, jwt_1.jwtForLogIn)(accountDetails.id),
        };
    }
    async webQrCodeLogin(encryptId, userId) {
        try {
            const jwtData = (0, jwt_1.verifyJwtToken)(encryptId);
            const webClientConnection = authHandler_1.authRouterWs.sockets.get(jwtData.connectionId);
            if (webClientConnection) {
                const accountDetails = await objects_1.database.user.findUnique({ where: { id: userId } });
                webClientConnection.emit("response", {
                    action: "webQrCodeLogin",
                    account: (0, class_transformer_1.plainToInstance)(userLoginResponseDto_1.UserLoginResponseDto, accountDetails, { excludeExtraneousValues: true }),
                    authToken: (0, jwt_1.jwtForLogIn)(accountDetails.id),
                });
                if (!accountDetails.isWebActive)
                    await objects_1.database.user.update({ where: { id: accountDetails.id }, data: { isWebActive: true } });
            }
            return { message: "Login Sucessfull" };
        }
        catch (error) {
            throw new errorHandler_1.AppError("Web Login Session has expired or is not valid", 401);
        }
    }
    async set2FAOtp(otp, userId) {
        await objects_1.database.twoFactorAuth.upsert({ where: { userId }, create: { userId }, update: { otpCode: otp ? (0, jwt_1.jwtForOtp)(otp) : null } });
    }
    async activateOrDeactivate2FA(action, userId) {
        if (action === "activate") {
            await this.set2FAOtp(null, userId);
            return { message: "2FA activated sucessfully" };
        }
        else {
            await objects_1.database.twoFactorAuth.delete({ where: { userId } });
            return { message: "2FA deactivated sucessfully" };
        }
    }
    async send2FAOtp(email) {
        const accountDetails = await this.checkAccount(email);
        if (!accountDetails)
            throw new errorHandler_1.AppError(`No account with ${email} exist`, 404);
        else if (!(await this.check2FAuth(accountDetails.id)))
            throw new errorHandler_1.AppError(`This account does not have 2FA activated`, 402);
        //create otp
        const otp = objects_1.randomData.num(1000, 9999);
        //save in database
        await this.set2FAOtp(otp, accountDetails.id);
        //send  email with otp
        objects_1.appEvents.emit("login-otp-email", { email: accountDetails.email, expiryTime: "3", otpCode: otp, username: accountDetails.username });
        return { message: "Otp code sent" };
    }
    async verify2FAOtp(otp, email) {
        const accountDetails = await this.checkAccount(email);
        if (!accountDetails)
            throw new errorHandler_1.AppError(`No account with ${email} exist`, 404);
        const otpInfo = await this.check2FAuth(accountDetails.id);
        if (!otpInfo)
            throw new errorHandler_1.AppError(`This account does not have 2FA activated`, 402);
        else if (!otpInfo.otpCode)
            throw new errorHandler_1.AppError("No otp code has been sent", 402);
        try {
            const { otpCode } = (0, jwt_1.verifyJwtToken)(otpInfo.otpCode);
            if (otpCode !== otp)
                throw new errorHandler_1.AppError("Wrong Otp code entered,check code", 402);
            return { authToken: (0, jwt_1.jwtForLogIn)(accountDetails.id) };
        }
        catch (error) {
            throw new errorHandler_1.AppError("Otp code has expired ,please request for another code", 402);
        }
    }
    async updateAccount(type, updatedData, userId) {
        const oldInfo = await objects_1.database.user.findUnique({ where: { id: userId } });
        if (type === "user" && oldInfo.type !== "user")
            throw new errorHandler_1.AppError("Account been updated must be an user account", 401);
        else if (type === "user" && updatedData.email) {
            const details = await objects_1.database.user.findUnique({ where: { email: updatedData.email } });
            if (details)
                throw new errorHandler_1.AppError("An Account with this email exist", 404);
        }
        else if (type === "admin" && oldInfo.type !== "admin")
            throw new errorHandler_1.AppError("Account been updated must be an admin account", 401);
        await objects_1.database.user.upsert({ where: { id: userId }, create: {}, update: updatedData });
        return { message: "Account Updated sucessfull" };
    }
    async changePassword(updatedData, userId) {
        const { oldPassword, newPassword } = updatedData;
        const oldInfo = await objects_1.database.user.findUnique({ where: { id: userId } });
        if (oldInfo.type !== "admin")
            throw new errorHandler_1.AppError("Only Admin Accounts can chang passwords", 401);
        await (0, bcrypt_1.verifyEncryptedData)(oldPassword, oldInfo.password);
        await objects_1.database.user.upsert({ where: { id: userId }, create: {}, update: { password: await (0, bcrypt_1.encryptData)(newPassword) } });
        return { message: "Password Changed sucessfully" };
    }
    async changePhoneNumber(userId, changePhoneDto) {
        const { newPhone, oldPhone } = changePhoneDto;
        const isThereAccountWithNewPhone = await objects_1.database.user.findUnique({ where: { phone: newPhone } });
        if (isThereAccountWithNewPhone)
            throw new errorHandler_1.AppError(`This phone ${newPhone} is already associated with account,please change the new phone number and try again`, 409);
        const account = await objects_1.database.user.findUnique({ where: { id: userId, phone: oldPhone } });
        if (!account)
            throw new errorHandler_1.AppError(`This phone ${oldPhone} is not associated with this account`, 404);
        await objects_1.database.user.update({ where: { id: userId, phone: oldPhone }, data: { phone: newPhone } });
        const usersWithOldContact = await objects_1.database.userContact.findMany({ where: { phone: oldPhone } });
        await objects_1.database.userContact.updateMany({ where: { phone: oldPhone }, data: { phone: newPhone } });
        const notificationsData = usersWithOldContact.map((contact) => {
            return { userId: contact.ownerId, data: { newPhone, oldPhone }, action: "phoneChange" };
        });
        await objects_1.database.notification.createMany({ data: notificationsData });
        return { nessage: `Phone has beeen changed sucessfully from ${oldPhone} to ${newPhone}` };
    }
    async createLoginQrCode(socket) {
        const qrCode = await qrcode_1.default.toDataURL((0, jwt_1.jwtForWsConnectionId)(socket.id));
        socket.emit("response", { action: "createLoginQrCode", qrCode });
    }
}
exports.AuthService = AuthService;
