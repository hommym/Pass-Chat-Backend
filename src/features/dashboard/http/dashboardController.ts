import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { dashboardService } from "../../../common/constants/objects";
import { checkAccountType } from "../../../common/middlewares/checkAccountType";
import { AppError } from "../../../common/middlewares/errorHandler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { UpdateCommunityVerificationStatus } from "../dto/updateCommunityVerficationStatusDto";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/daily/users",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getNumberOfDailyData("users"));
  })
);

dashboardRouter.get(
  "/daily/active-communities",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getNumberOfDailyData("activeCommunities"));
  })
);

dashboardRouter.get(
  "/daily/flagged-messages",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getNumberOfDailyData("flaggedMessage"));
  })
);

dashboardRouter.get(
  "/daily/banned-accounts",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getNumberOfDailyData("bannedAccounts"));
  })
);

dashboardRouter.get(
  "/user-growth-trend/:year",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { year } = req.params;
      res.status(200).json(await dashboardService.getUserGrowthTrend(+year));
    } catch (error) {
      throw new AppError("Url parameter year must be a valid year", 400);
    }
  })
);

dashboardRouter.get(
  "/community-verfication/applications",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getAllPendingComunityVerfRequests());
  })
);

dashboardRouter.patch(
  "/community-verfication/application/review",
  verifyJwt,
  checkAccountType("admin"),
  bodyValidator(UpdateCommunityVerificationStatus),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.updateCommunityVerificationStatus(req.body));
  })
);
