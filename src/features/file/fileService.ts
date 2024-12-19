import { join } from "path";
import { checkPathExists } from "../../common/helpers/path";
import { mkdir, writeFile } from "fs/promises";
import { UploadFileDto } from "./dtos/uploadFileDto";

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
    const originalFilePath = join(__dirname, "..", "..","..",`/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/original.${fileName.split(".")[1]}`);

    const optimizeFilePath = join(__dirname, "..", "..", "..",`/storage/${mediaType}s/${date}/${fileName.split(".")[0]}/optimize.${fileName.split(".")[1]}`);

    if (await checkPathExists(optimizeFilePath)) return optimizeFilePath;
    return originalFilePath;
  }
}
