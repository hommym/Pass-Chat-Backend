import dotenv from "dotenv";
dotenv.config();
import { Router } from "express";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import { getFile } from "../../../common/libs/multer";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { UploadFileDto } from "../dtos/uploadFileDto";
import { fileService } from "../../../common/constants/objects";
import { fileHandler } from "../../../common/middlewares/fileHandler";

export const fileRouter = Router();

fileRouter.post(
  "/upload",
  getFile("file"),
  verifyJwt,
  bodyValidator(UploadFileDto),
  fileHandler,
  asyncHandler(async (req: Request, res: Response) => {
    const { date, mediaType, fileName } = req.body as UploadFileDto;
    res.status(201).json({ link: `${process.env.BackendUrl}/file/${mediaType}/${date}/${fileName}` });
  })
);

fileRouter.get(
  "/:mediaType/:date/:fileName",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { date, mediaType, fileName } = req.params as { date: string; mediaType: "video" | "image" | "audio"|"doc"; fileName: string };
    res.status(200).sendFile(await fileService.getPath({ date, mediaType, fileName }));
  })
);
