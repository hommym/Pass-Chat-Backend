import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { SubmitReportDto } from "../dto/submitReportDto";
import { reportService } from "../../../common/constants/objects";
import { checkAccountType } from "../../../common/middlewares/checkAccountType";
import { ResolveReportDto } from "../dto/resolveReportsDto";

export const reportRouter = Router();

reportRouter.post(
  "/submit",
  bodyValidator(SubmitReportDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...reportDto } = req.body;
    res.status(201).json(await reportService.submitReport(reportDto));
  })
);

reportRouter.get(
  "/all",
  verifyJwt,
  checkAccountType("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await reportService.getAllReports());
  })
);
reportRouter.patch(
  "/resolved",
  verifyJwt,
  checkAccountType("admin"),
  bodyValidator(ResolveReportDto),
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...resolveDto } = req.body;
    res.status(200).json(await reportService.resolveReport(resolveDto));
  })
);
