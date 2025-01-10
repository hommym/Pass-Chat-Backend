import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { AppError } from "../../../common/middlewares/errorHandler";
import { communityService } from "../../../common/constants/objects";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { CreateCommunityDto } from "../dto/createCommunityDto";
import { ChannelPermissionDto, GroupPermissionsDto } from "../dto/permissionsDto";
import { UpdateRoleDto } from "../dto/updateRoleDto";

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

communityRouter.post(
  "/:type/:name/join",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { type, name } = req.params;
    if (!(type === "channel" || type === "group")) throw new AppError("Valid values for type url parameter should be channel or group", 400);
    else if (!name) throw new AppError("No value passed for the url parameter name", 400);
    const { verifiedUserId } = req.body;
    res.status(201).json(await communityService.joinCommunity(type, name, verifiedUserId));
  })
);

communityRouter.delete(
  "/:type/:name/exit",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { type, name } = req.params;
    if (!(type === "channel" || type === "group")) throw new AppError("Valid values for type url parameter should be channel or group", 400);
    else if (!name) throw new AppError("No value passed for the url parameter name", 400);
    const { verifiedUserId } = req.body;
    await communityService.exitCommunity(type, name, verifiedUserId);
    res.status(204).end();
  })
);

communityRouter.patch(
  "/:type/:name/role",
  bodyValidator(UpdateRoleDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { type, name } = req.params;
    if (!(type === "channel" || type === "group")) throw new AppError("Valid values for type url parameter should be channel or group", 400);
    else if (!name) throw new AppError("No value passed for the url parameter name", 400);
    const { verifiedUserId, ...updateRoleDto } = req.body;
    await communityService.updateMemberRole(type, name, verifiedUserId, updateRoleDto);
    res.status(204).end();
  })
);

communityRouter.patch(
  "/group/permissions",
  bodyValidator(GroupPermissionsDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...updatePermissionsDto } = req.body;
    res.status(200).json(await communityService.updatePermissions(verifiedUserId, updatePermissionsDto, "group"));
  })
);

communityRouter.patch(
  "/channel/permissions",
  bodyValidator(ChannelPermissionDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...updatePermissionsDto } = req.body;
    res.status(200).json(await communityService.updatePermissions(verifiedUserId, updatePermissionsDto, "channel"));
  })
);

communityRouter.get(
  "/all/user",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId } = req.body;
    res.status(200).json(await communityService.getAllUsersCommunities(verifiedUserId));
  })
);

communityRouter.get(
  "/details",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, communityId } = req.body;
    if (!communityId) throw new AppError("No data passed for communityId in body", 400);
    res.status(200).json(await communityService.getCommunityDetailsForUser(verifiedUserId, communityId));
  })
);

communityRouter.get(
  "/search",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, keyword } = req.body;
    if (!keyword) throw new AppError("No Value passed for group or channel name", 400);
    res.status(200).json(await communityService.search(keyword));
  })
);
