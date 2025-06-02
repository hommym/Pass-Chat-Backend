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
import { SaveFileInFolderDto } from "../dtos/saveFileInFolderDto";
import { CreateFolderDto } from "../dtos/createFolderDto";
import { RenameFileOrFolderDto } from "../dtos/renameFileOrFolderDto";
import { MoveFileOrFolderDto } from "../dtos/moveFileOrFolderDto";
import { DeleteFileOrFolderDto } from "../dtos/deleteFilesOrFoldersDto";

export const fileRouter = Router();

fileRouter.post(
  "/upload",
  getFile("file"),
  verifyJwt,
  bodyValidator(UploadFileDto),
  fileHandler,
  asyncHandler(async (req: Request, res: Response) => {
    const { date, mediaType, fileName } = req.body as UploadFileDto;
    res
      .status(201)
      .json(
        mediaType === "video"
          ? { link: `${process.env.FileServerBaseUrl}/${mediaType}/${date}/${fileName}`, thumbNail: `${process.env.FileServerBaseUrl}/image/${date}/${fileName.split(".")[0]}.png` }
          : { link: `${process.env.FileServerBaseUrl}/${mediaType}/${date}/${fileName}` }
      );
  })
);

fileRouter.get(
  "/:mediaType/:date/:fileName",
  asyncHandler(async (req: Request, res: Response) => {
    const { date, mediaType, fileName } = req.params as { date: string; mediaType: "video" | "image" | "audio" | "doc"; fileName: string };
    res.status(200).sendFile(await fileService.getPath({ date, mediaType, fileName }));
  })
);

fileRouter.post(
  "/save",
  getFile("file"),
  bodyValidator(SaveFileInFolderDto),
  verifyJwt,
  fileHandler,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...saveFileDto } = req.body;
    const { date, mediaType, fileName } = saveFileDto;
    const url = `${process.env.FileServerBaseUrl}/${mediaType}/${date}/${fileName}`;
    res.status(201).json(await fileService.saveFolderOrFile(saveFileDto as SaveFileInFolderDto, verifiedUserId, "file", url));
  })
);

fileRouter.post(
  "/directory/save",
  bodyValidator(CreateFolderDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...saveFolderDto } = req.body;
    res.status(201).json(await fileService.saveFolderOrFile(saveFolderDto as CreateFolderDto, verifiedUserId, "directory", null));
  })
);

fileRouter.get(
  "/all",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId } = req.body;
    res.status(200).json(await fileService.getAllFilesAndFolders(verifiedUserId));
  })
);

fileRouter.put(
  "/rename",
  bodyValidator(RenameFileOrFolderDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...renameDto } = req.body;
    res.status(200).json(await fileService.renameFileOrFolder(renameDto, verifiedUserId));
  })
);

fileRouter.put(
  "/move",
  bodyValidator(MoveFileOrFolderDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...moveDto } = req.body;
    res.status(200).json(await fileService.moveFileOrFolder(moveDto, verifiedUserId));
  })
);

fileRouter.delete(
  "/",
  bodyValidator(DeleteFileOrFolderDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...deleteDto } = req.body;
    await fileService.deleteFileOrFolder(deleteDto, verifiedUserId);
    res.status(204).end();
  })
);
