import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { dashboardService } from "../../../common/constants/objects";
import { checkAccountType } from "../../../common/middlewares/checkAccountType";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/daily-users",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getNumberOfDailyData("users"));
  })
);

dashboardRouter.get(
  "/active-communities",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getNumberOfDailyData("activeCommunities"));
  })
);
