import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { AppError } from "../../../common/middlewares/errorHandler";
import { communityService } from "../../../common/constants/objects";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { CreateCommunityDto } from "../dto/createCommunityDto";
import { PermissionsDto } from "../dto/permissionsDto";

export const communityRouter = Router();

communityRouter.post(
  "/:type",
  bodyValidator(CreateCommunityDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const { verifiedUserId, ...creatCommunityDto } = req.body;
    if (!(type === "channel" || type === "group")) throw new AppError("Valid values for type params should be channel or group", 400);
    res.status(201).json(await communityService.createCommunity(type, creatCommunityDto, verifiedUserId));
  })
);

communityRouter.patch(
  "/group/permissions",
  bodyValidator(PermissionsDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...updatePermissionsDto } = req.body;
    res.status(200).json(await communityService.updateGroupPermissions(verifiedUserId, updatePermissionsDto));
  })
);
