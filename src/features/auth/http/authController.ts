import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { UserLoginDto } from "../dtos/userLoginDto";
import { authService } from "../../../common/constants/objects";
import { AdminLoginDto } from "../dtos/adminLoginDto";
import { Verify2FAOtpDto } from "../dtos/verify2FAOtpDto";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import { Setup2FADto } from "../dtos/setUp2FADto";
import { UpdateUserAccountDto } from "../dtos/updateUserAccountDto";
import { UpdateAdminAccountDto } from "../dtos/updateAdminAccountDto";
import { ChangePasswordDto } from "../dtos/changePasswordDto";
import { CreateAdminDto } from "../dtos/createAdminDto";
import { AppError } from "../../../common/middlewares/errorHandler";
import { ChangePhoneDto } from "../dtos/changePhoneDto";

export const authRouter = Router();

// All Auth Endpoints

authRouter.post(
  "/admin/create-account",
  bodyValidator(CreateAdminDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...accountDetails } = req.body;
    res.status(201).json(await authService.createAdminAccount(accountDetails, verifiedUserId));
  })
);

authRouter.post(
  "/user/login",
  bodyValidator(UserLoginDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.login("user", req.body));
  })
);

authRouter.post(
  "/user/web/login",
  bodyValidator(UserLoginDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.webLogin(req.body));
  })
);

authRouter.post(
  "/user/web/sendOtp/:phone",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.sendOtpForWeb(null, req.params.phone));
  })
);

authRouter.post(
  "/user/web/verify/otp",
  bodyValidator(Verify2FAOtpDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.verify2FAOtp(req.body as Verify2FAOtpDto, "user"));
  })
);

authRouter.post(
  "/user/web/qr-code/login",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { webClientId, verifiedUserId } = req.body;
    if (!webClientId) throw new AppError("No Values Passed for webClientId", 400);
    res.status(200).json(await authService.webQrCodeLogin(webClientId, verifiedUserId));
  })
);

authRouter.post(
  "/user/logout",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { webLogout } = req.query;
    res.status(201).json(await authService.logout(req.body.verifiedUserId, webLogout ? true : false));
  })
);

authRouter.post(
  "/admin/login",
  bodyValidator(AdminLoginDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.login("admin", req.body));
  })
);

authRouter.post(
  "/admin/send/otp/:email",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.send2FAOtp(req.params.email));
  })
);

authRouter.post(
  "/admin/verify/otp",
  bodyValidator(Verify2FAOtpDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await authService.verify2FAOtp(req.body as Verify2FAOtpDto));
  })
);

authRouter.post(
  "/admin/setup/2FA",
  bodyValidator(Setup2FADto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { action, verifiedUserId } = req.body;
    res.status(201).json(await authService.activateOrDeactivate2FA(action, verifiedUserId));
  })
);

authRouter.patch(
  "/user/account",
  bodyValidator(UpdateUserAccountDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...updatedData } = req.body;
    res.status(200).json(await authService.updateAccount("user", updatedData, verifiedUserId));
  })
);

authRouter.patch(
  "/user/change-phone",
  bodyValidator(ChangePhoneDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...changePhoneDto } = req.body;
    res.status(200).json(await authService.changePhoneNumber(verifiedUserId, changePhoneDto as ChangePhoneDto));
  })
);

authRouter.patch(
  "/admin/account",
  bodyValidator(UpdateAdminAccountDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...updatedData } = req.body;
    res.status(200).json(await authService.updateAccount("admin", updatedData, verifiedUserId));
  })
);

authRouter.patch(
  "/admin/change-password",
  bodyValidator(ChangePasswordDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...updatedData } = req.body;
    res.status(200).json(await authService.changePassword(updatedData, verifiedUserId));
  })
);
