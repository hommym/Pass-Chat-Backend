import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { AppError } from "./errorHandler";
import { join } from "path";
import { checkPathExists } from "../helpers/path";
import { mkdir } from "fs/promises";
import { allowedDocumentMimeTypes, allowedMediaMimeTypes } from "../constants/list";
import { UploadFileDto } from "../../features/file/dtos/uploadFileDto";
import { database, fileService } from "../constants/objects";
import { SubScriptionBenefits } from "../../features/subscription/dto/subscriptionBenefits";

type FileUploadLimits = {
  maxFilesSizePerDay: number;
  maxFilesSizePerUpload: number;
};

export const fileHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { buffer, mimetype, size } = req.file!;
  const { mediaType, fileName, date } = req.body as UploadFileDto;
  const userSub = await database.userSubscription.findMany({ where: { userId: req.body.verifiedUserId, status: "paid" }, include: { subPlan: true } });

  // check file size limit per upload and per day
  const fileLimitsData = userSub.length !== 0 ? (userSub[0].subPlan.benefit as FileUploadLimits) : { maxFilesSizePerDay: 20, maxFilesSizePerUpload: 2 }; // sizes in gb

  //checking if file size exceed the allowed limit per upload .
  if (fileLimitsData.maxFilesSizePerUpload < size / 1073741824) throw new AppError(`File size exceeds the allowed limit of ${fileLimitsData.maxFilesSizePerUpload}GB`, 413);

  
  // check if the daily file size quota is reached(N/A)

  let dirPath = join(__dirname, "..", "..", "..", "/storage");

  dirPath = join(dirPath, `/${mediaType}s/${date}/${fileName.split(".")[0]}`);

  if (!(allowedMediaMimeTypes.includes(mimetype) || allowedDocumentMimeTypes.includes(mimetype))) {
    throw new AppError(`The file type ${mimetype} is supported`, 400);
  } else if (await checkPathExists(dirPath)) {
    throw new AppError("File already exist", 409);
  }
  await fileService.saveFile(dirPath, buffer, fileName.split(".")[1]);
  if (mediaType === "video") {
    // create and save a video thumbnail
    const thumbNailPath = join(__dirname, "..", "..", "..", `/storage/images/${date}/${fileName.split(".")[0]}`);
    await fileService.getVideoThumbNail(join(dirPath, `original.${fileName.split(".")[1]}`), thumbNailPath, "original.png");
  }
  next();
});
