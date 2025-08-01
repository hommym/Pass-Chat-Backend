import { join } from "path";
import { checkPathExists } from "../../common/helpers/path";
import { mkdir, writeFile } from "fs/promises";
import { UploadFileDto } from "./dtos/uploadFileDto";
import { database, randomData } from "../../common/constants/objects";
import { CreateFolderDto } from "./dtos/createFolderDto";
import { SaveFileInFolderDto } from "./dtos/saveFileInFolderDto";
import { RenameFileOrFolderDto } from "./dtos/renameFileOrFolderDto";
import { MoveFileOrFolderDto } from "./dtos/moveFileOrFolderDto";
import { File } from "@prisma/client";
import { AppError } from "../../common/middlewares/errorHandler";
import { DeleteFileOrFolderDto } from "./dtos/deleteFilesOrFoldersDto";
import ffmpeg from "fluent-ffmpeg";

export class FileService {
  async saveFile(dirPath: string, file: Buffer, extention: string) {
    // check if path dir exist
    //if no create dirs
    // if yes save file through events
    if (!(await checkPathExists(dirPath))) {
      await mkdir(dirPath, { recursive: true });
    }
    await writeFile(join(dirPath, `/original.${extention}`), file);
    // Add file optimizations(N/A)
  }

  async getPath(detail: UploadFileDto) {
    const { date, fileName, mediaType } = detail;
    const originalFilePath = join(__dirname, "..", "..", "..", `/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/original.${fileName.split(".")[1]}`);

    const optimizeFilePath = join(__dirname, "..", "..", "..", `/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/optimize.${fileName.split(".")[1]}`);

    if (await checkPathExists(optimizeFilePath)) return optimizeFilePath;
    else if (!await checkPathExists(originalFilePath)) throw new AppError("No such file exist", 404);
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
}
