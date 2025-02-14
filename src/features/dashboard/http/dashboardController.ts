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

dashboardRouter.get(
  "/user-management/users",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query;
      res.status(200).json(await dashboardService.getAllUsers(page ? +page : 1, limit ? +limit : 20));
    } catch (error) {
      throw new AppError(error instanceof AppError ? error.message : "Query params size and limit should be of type integers", 400);
    }
  })
);

dashboardRouter.get(
  "/user-management/user/details/:id",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.status(200).json(await dashboardService.getUserDetails(+id));
    } catch (error) {
      throw new AppError(error instanceof AppError ? error.message : "Url parameter id must be an integer", 400);
    }
  })
);

dashboardRouter.get(
  "/user-management/community/:type",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    if (type === "groups" || type === "channels") {
      try {
        const { page, limit } = req.query;
        res.status(200).json(await dashboardService.getAllCommunities(page ? +page : 1, limit ? +limit : 20, type === "groups" ? "group" : "channel"));
      } catch (error) {
        throw new AppError(error instanceof AppError ? error.message : "Query params size and limit should be of type integers", 400);
      }
    } else {
      throw new AppError("Url parameter type must have a value groups or channels", 400);
    }
  })
);

dashboardRouter.get(
  "/user-management/community/details/:id",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.status(200).json(await dashboardService.getCommunityDetails(+id));
    } catch (error) {
      throw new AppError(error instanceof AppError ? error.message : "Url parameter id must be an integer", 400);
    }
  })
);

dashboardRouter.get(
  "/content-management",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getContentManagementPageData());
  })
);

dashboardRouter.get(
  "/analytics",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await dashboardService.getAnalyticsPageData());
  })
);
