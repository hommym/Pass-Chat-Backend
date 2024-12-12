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

export const authRouter = Router();

// All Auth Endpoints

authRouter.post(
  "/admin/ceate-account",
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
    const { email, otpCode } = req.body as Verify2FAOtpDto;
    res.status(201).json(await authService.verify2FAOtp(otpCode, email));
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
