import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { AppError } from "./errorHandler";
import { join } from "path";
import { checkPathExists } from "../helpers/path";
import { mkdir } from "fs/promises";
import { allowedDocumentMimeTypes, allowedMediaMimeTypes } from "../constants/list";
import { UploadFileDto } from "../../features/file/dtos/uploadFileDto";
import { fileService } from "../constants/objects";



export const fileHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { buffer, mimetype } = req.file!;
  const { mediaType, fileName, date } = req.body as UploadFileDto;
  let dirPath = join(__dirname, "..", "..", "..", "/storage");

  dirPath = join(dirPath, `/${mediaType}s/${date}/${fileName.split(".")[0]}`);

  if (!(allowedMediaMimeTypes.includes(mimetype)|| allowedDocumentMimeTypes.includes(mimetype))) {
    throw new AppError(`The file type ${mimetype} is supported`, 400);
  } else if (await checkPathExists(dirPath)) {
    throw new AppError("File already exist", 409);
  }
  await fileService.saveFile(dirPath, buffer, fileName.split(".")[1]);
  next();
});
