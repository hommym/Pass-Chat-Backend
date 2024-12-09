import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { UserLoginDto } from "../dtos/userLoginDto";
import { authService } from "../../../common/constants/objects";
import { AdminLoginDto } from "../dtos/adminLoginDto";

export const authRouter = Router();

// All Auth Endpoints

authRouter.post(
  "/user/login",
  bodyValidator(UserLoginDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(authService.login("user", req.body));
  })
);

authRouter.post(
  "/admin/login",
  bodyValidator(AdminLoginDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(authService.login("admin", req.body));
  })
);


// endpoints for sending ,resending and verifying  otp for admins
