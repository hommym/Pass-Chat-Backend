import { join } from "path";
import { checkPathExists } from "../../common/helpers/path";
import { mkdir, writeFile } from "fs/promises";
import { UploadFileDto } from "./dtos/uploadFileDto";
import { appEvents, database, randomData } from "../../common/constants/objects";
import { CreateFolderDto } from "./dtos/createFolderDto";
import { SaveFileInFolderDto } from "./dtos/saveFileInFolderDto";
import { RenameFileOrFolderDto } from "./dtos/renameFileOrFolderDto";
import { MoveFileOrFolderDto } from "./dtos/moveFileOrFolderDto";
import { File } from "@prisma/client";
import { AppError } from "../../common/middlewares/errorHandler";
import { DeleteFileOrFolderDto } from "./dtos/deleteFilesOrFoldersDto";
import ffmpeg from "fluent-ffmpeg";
import { getFileMetaData } from "../../common/helpers/file";

export class FileService {
  saveFile = async (args: { dirPath: string; file: Buffer; extention: string; mediaType: "video" | "image" | "audio" | "doc"; date: string; thumpNailFileName: string }) => {
    // check if path dir exist
    //if no create dirs
    // if yes save file through events
    const { dirPath, extention, file, mediaType, date, thumpNailFileName } = args;
    if (!(await checkPathExists(dirPath))) {
      await mkdir(dirPath, { recursive: true });
    }
    const originalPath = join(dirPath, `/original.${extention}`);
    const compressedPath = join(dirPath, `/compressed.${extention}`);
    await writeFile(originalPath, file);

    if (mediaType === "video") {
      // create and save a video thumbnail
      const thumbNailPath = join(__dirname, "..", "..", "..", `/storage/images/${date}/${thumpNailFileName}`);
      await mkdir(thumbNailPath, { recursive: true });
      await this.getVideoThumbNail(originalPath, thumbNailPath, "original.png");
      const thumpOrigPath = join(thumbNailPath, `/original.png`);
      const thumbComPath = join(thumbNailPath, `/compressed.png`);
      appEvents.emit("compress-file", { originalPath: thumpOrigPath, compressedPath: thumbComPath, mediaType: "image" });
    }

    //compress media files
    if (mediaType !== "doc") appEvents.emit("compress-file", { originalPath, compressedPath, mediaType });
  };

  async getPath(detail: UploadFileDto) {
    const { date, fileName, mediaType } = detail;
    const originalFilePath = join(__dirname, "..", "..", "..", `/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/original.${fileName.split(".")[1]}`);

    const optimizeFilePath = join(__dirname, "..", "..", "..", `/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/compressed.${fileName.split(".")[1]}`);

    if (await checkPathExists(optimizeFilePath)) return optimizeFilePath;
    else if (!(await checkPathExists(originalFilePath))) throw new AppError("No such file exist", 404);
    return originalFilePath;
  }

  async checkRootOrCreate(ownerId: number) {
    let rootFolder = await database.file.findMany({ where: { ownerId, isRoot: true } });
    if (rootFolder.length === 0) {
      // creating root folder for user
      return await database.file.create({ data: { name: "/", ownerId, isRoot: true, type: "dir" } });
    }

    return rootFolder[0];
  }

  async checkFolderOrFile(itemId: number) {
    return await database.file.findUnique({ where: { id: itemId } });
  }

  async checkFileOrFolderInDirectory(itemName: string, directoryId: number, ownerId: number, type: "norm" | "dir") {
    return database.file.findUnique({ where: { ownerId_parentId_name_type: { name: itemName, ownerId, parentId: directoryId, type } } });
  }

  async checkFolderLimit(userId: number) {
    // this methods checks folder limits by returning true if the limit is up
    const subPlan = await database.userSubscription.findMany({ where: { userId, status: "paid" }, include: { subPlan: true } });
    const folderLimit = subPlan.length !== 0 ? (subPlan[0].subPlan.benefit as any).maxFoldersCount : 5;

    const totalFolderCount = await database.file.findMany({ where: { ownerId: userId, isRoot: false } });

    return totalFolderCount.length > folderLimit;
  }

  async saveFolderOrFile(createItemDto: CreateFolderDto | SaveFileInFolderDto, ownerId: number, type: "file" | "directory", urlToFile: string | null) {
    // checking user folder count limit

    if (type === "directory") if (await this.checkFolderLimit(ownerId)) throw new AppError(`Folder number exceeds the allowed limit`, 413);

    const { parentFolderId, name } = createItemDto;
    // setting parent folder to root folder if parentFolderId is not provided
    let parentFolder: File | null = await this.checkRootOrCreate(ownerId);

    if (parentFolderId) {
      try {
        parentFolder = await database.file.findUnique({ where: { id: +parentFolderId, type: "dir" } });
      } catch (error) {
        throw new AppError("parentId should be string with an integer value", 400);
      }
      if (!parentFolder) throw new AppError("The Parent Folder specified does not exist", 404);
    }

    if (await this.checkFileOrFolderInDirectory(name, parentFolder.id, ownerId, type === "file" ? "norm" : "dir"))
      throw new AppError(`A ${type} with this name:${name} already exist in this location`, 409);

    return await database.file.create({
      data: { ownerId, name, type: type === "file" ? "norm" : "dir", dataUrl: urlToFile, parentId: parentFolder.id },
      omit: { isRoot: true, ownerId: true },
    });
  }

  async getAllFilesAndFolders(ownerId: number) {
    return await database.file.findMany({ where: { ownerId }, omit: { ownerId: true } });
  }

  async renameFileOrFolder(renameDto: RenameFileOrFolderDto, ownerId: number) {
    const { itemId, newName } = renameDto;
    const item = await this.checkFolderOrFile(itemId);

    if (!item) {
      throw new AppError("Rename Failed ,item does not exist", 404);
    } else if (item.ownerId !== ownerId) throw new AppError("Rename Failed,you can only move items that belongs to you", 402);
    else if ((await this.checkFileOrFolderInDirectory(newName, item.parentId!, ownerId, item.type)) && newName !== item.name)
      throw new AppError(`A ${item.type === "norm" ? "file" : "directory"} with this name:${newName} already exist in this location`, 409);

    const updatedItem = await database.file.update({ where: { id: itemId }, data: { name: newName } });
    return { message: `Rename Successful ,oldName:${item.name} newName:${updatedItem.name}` };
  }

  async moveFileOrFolder(moveDto: MoveFileOrFolderDto, ownerId: number) {
    const { itemId, parentFolderId } = moveDto;

    if (parentFolderId === itemId) {
      throw new AppError("Move Failed ,cannot move an item to itself", 401);
    }

    const item = await this.checkFolderOrFile(itemId);

    const parentFolder = await this.checkFolderOrFile(parentFolderId);

    if (!item || !parentFolder) {
      throw new AppError(!item ? "Move Failed , item being moved does not exist" : "Move Failed , No directory with this id exist", 404);
    } else if (parentFolder.type !== "dir") {
      throw new AppError("Move Failed ,No directory with this id exist ", 404);
    } else if (item.ownerId !== ownerId) {
      throw new AppError("Move Failed , you can only move items that belongs to you", 402);
    } else if ((await this.checkFileOrFolderInDirectory(item.name, parentFolderId, ownerId, item.type)) && item.parentId !== parentFolderId)
      throw new AppError(`A ${item.type === "norm" ? "file" : "directory"} with this name:${item.name} already exist in this location`, 409);
    else if (item.isRoot) throw new AppError("Move Failed,cannot move root directory", 402);

    await database.file.update({ where: { id: itemId }, data: { parentId: parentFolderId } });
    return { mesage: "Move Successful" };
  }

  async deleteFileOrFolder(deleteItemsDto: DeleteFileOrFolderDto, ownerId: number) {
    const { itemIds } = deleteItemsDto;
    await database.file.deleteMany({ where: { isRoot: false, id: { in: itemIds }, ownerId } });
  }

  async getVideoThumbNail(srcFilePath: string, finalFolderPath: string, filename: string) {
    return new Promise((resolve, reject) => {
      const timeToGetFrame = randomData.num(1, 5);
      ffmpeg(srcFilePath)
        .screenshot({ timestamps: [`00:00:0${timeToGetFrame}`], folder: finalFolderPath, filename })
        .on("end", () => {
          resolve(undefined);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  async updateDailyUploadQuota(args: { userId: number; updatedSize: number }) {
    const { userId, updatedSize } = args;
    await database.dailyUploadQuota.update({ where: { userId }, data: { quotaUsed: updatedSize } });
  }

  compressFile = async (args: { originalPath: string; compressedPath: string; mediaType: "video" | "image" | "audio" }) => {
    

    const { compressedPath, mediaType, originalPath } = args;
    console.log(`Compressing ${mediaType}...`);
    console.log("Checking if file is valid for compression..");
    const fileSize= (await getFileMetaData(originalPath)).size
    switch (mediaType) {
      case "video":
         if (fileSize >= 1048576) this.compressVideo(originalPath, compressedPath);
        break;
      case "image":
         if (fileSize >= 102400) this.compressImage(originalPath, compressedPath);
        break;
      default:
         if ((fileSize >= 512000)) this.compressAudio(originalPath, compressedPath);
        break;
    }
  };

  compressVideo(originalPath: string, compressedPath: string) {
    let vidCodec: string;
    let audCodec: string;
    let compressionOpt: string[];

    if (originalPath.endsWith(".mp4")) {
      vidCodec = "libx264";
      audCodec = "aac";
      compressionOpt = ["-preset slow", "-crf 23", "-b:a 128k"];
    } else if (originalPath.endsWith(".webm")) {
      vidCodec = "libvpx-vp9";
      audCodec = "libvorbis";
      compressionOpt = ["-b:v 0", "-crf 33", "-b:a 128k"];
    } else return;

    ffmpeg(originalPath)
      .videoCodec(vidCodec)
      .audioCodec(audCodec)
      .outputOption(compressionOpt)
      .on("start", (cmd) => console.log("running compression..."))
      .on("error", (err) => console.log("error occurred during compression:" + err))
      .on("end", () => console.log("Video Sucessfully Compressed"))
      .save(compressedPath);
  }

  async compressAudio(originalPath: string, compressedPath: string) {
    let audCodec: string;
    let compressionOpt: string[];
    let freq: number;
    let bitRate: string;

    if (originalPath.endsWith(".mp3")) {
      audCodec = "libmp3lame";
      compressionOpt = [];
      freq = 22050;
      bitRate = "16k";
    } else if (originalPath.endsWith(".m4a") || originalPath.endsWith(".aac")) {
      audCodec = "aac";
      compressionOpt = ["-movflags +faststart"];
      freq = 22050;
      bitRate = "16k";
    } else if (originalPath.endsWith(".ogg")) {
      audCodec = "libvorbis";
      compressionOpt = [];
      freq = 22050;
      bitRate = "16k";
    } else return;
    ffmpeg(originalPath)
      .audioCodec(audCodec)
      .audioBitrate(bitRate)
      .audioChannels(1)
      .audioFrequency(freq)
      .outputOption(compressionOpt)
      .on("start", (cmd) => console.log("running compression..."))
      .on("error", (err) => console.log("error occurred during compression:" + err))
      .on("end", () => console.log("Audio Sucessfully Compressed"))
      .save(compressedPath);
  }

  compressImage(originalPath: string, compressedPath: string) {
    let compressionOpt: string;
    if (originalPath.endsWith(".png")) {
      compressionOpt = "-compression_level 60";
    } else if (originalPath.endsWith(".jpg") || originalPath.endsWith(".jpeg")) {
      compressionOpt = "-q:v 5";
    } else return;

    ffmpeg(originalPath)
      .outputOption(["-vf scale=iw*0.5:-1", "-map_metadata -1", compressionOpt])
      .on("start", (cmd) => console.log("running compression..."))
      .on("error", (err) => console.log("error occurred during compression:" + err))
      .on("end", () => console.log("image Sucessfully Compressed"))
      .save(compressedPath);
  }
}
