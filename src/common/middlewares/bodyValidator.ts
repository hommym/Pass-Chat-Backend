import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { AppError } from "./errorHandler";

export function bodyValidator(type: any): any {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(type, req.body, { excludeExtraneousValues: true });
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      console.log(errors);
      throw new AppError("Invalid Request Body", 400);
    }
    // Replace the body with the filtered DTO instance
    req.body = dtoInstance;
    next();
  });
}
