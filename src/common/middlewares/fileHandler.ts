import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { AppError } from "./errorHandler";
import { join } from "path";
import { checkPathExists } from "../helpers/path";
import { mkdir } from "fs/promises";
import { allowedDocumentMimeTypes, allowedMediaMimeTypes } from "../constants/list";
import { UploadFileDto } from "../../features/file/dtos/uploadFileDto";
import { appEvents, database, fileService } from "../constants/objects";
import { SubScriptionBenefits } from "../../features/subscription/dto/subscriptionBenefits";
import { getCurrentDate } from "../helpers/date";

type FileUploadLimits = {
  maxFilesSizePerDay: number;
  maxFilesSizePerUpload: number;
};

const getQoutaData = async (userId: number) => {
  const quotaData = await database.dailyUploadQuota.findUnique({ where: { userId } });
  const cDate = getCurrentDate(); // current date in form yyyy-mm-dd
  if (!quotaData) {
    return await database.dailyUploadQuota.create({ data: { userId, day: cDate } });
  } else if (quotaData.day !== cDate) {
    quotaData.quotaUsed = 0;
    await database.dailyUploadQuota.update({ where: { userId }, data: { day: cDate, quotaUsed: 0 } });
  }

  return quotaData;
};

const checkDailyUploadLimit = async (uploadSize: number, userId: number, dailySizeLimit: number) => {
  const uploadQuotaData = await getQoutaData(userId);
  const quotaUsed = uploadSize + uploadQuotaData.quotaUsed;
  const isLimitUp = quotaUsed > dailySizeLimit;
  if (!isLimitUp) appEvents.emit("update-daily-upload-quota", { userId, updatedSize: quotaUsed });
  return isLimitUp;
};

export const fileHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { buffer, mimetype, size } = req.file!;
  const { mediaType, fileName, date } = req.body as UploadFileDto;
  const userSub = await database.userSubscription.findMany({ where: { userId: req.body.verifiedUserId, status: "paid" }, include: { subPlan: true } });
  const sizeInGb = size / 1073741824;
  // check file size limit per upload and per day
  const fileLimitsData = userSub.length !== 0 ? (userSub[0].subPlan.benefit as FileUploadLimits) : { maxFilesSizePerDay: 20, maxFilesSizePerUpload: 2 }; // sizes in gb

  //checking if file size exceed the allowed limit per upload .
  if (fileLimitsData.maxFilesSizePerUpload < sizeInGb) throw new AppError(`File size exceeds the allowed limit of ${fileLimitsData.maxFilesSizePerUpload}GB`, 413);
  else if (await checkDailyUploadLimit(sizeInGb, req.body.verifiedUserId, fileLimitsData.maxFilesSizePerDay))
    throw new AppError(`File size exceeds the allowed limit of ${fileLimitsData.maxFilesSizePerDay}GB per day`, 413);
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
