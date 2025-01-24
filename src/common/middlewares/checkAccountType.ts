import { AccountType } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { database } from "../constants/objects";
import { AppError } from "./errorHandler";

export const checkAccountType = (acountType: AccountType) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { verifiedUserId } = req.body;
    const account = await database.user.findUnique({ where: { id: verifiedUserId, type: acountType } });
    if (!account) throw new AppError("User Not Authorized", 401);
    next();
  });
};
