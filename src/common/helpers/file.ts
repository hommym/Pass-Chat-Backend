import { access, copyFile, mkdir, stat } from "fs/promises";
import { dirname } from "path";

export const copyFileToStorage = async (sourcePath: string, destinationPath: string): Promise<void> => {
  try {
    // Ensure the source file exists
    await access(sourcePath);

    // Create the destination directory if it doesn't exist
    const destinationDir = dirname(destinationPath);
    await mkdir(destinationDir, { recursive: true });

    // Copy the file
    await copyFile(sourcePath, destinationPath);

    console.log(`File copied from ${sourcePath} to ${destinationPath}`);
  } catch (error) {
    console.error(`Error copying file:`, error);
    throw error;
  }
};

export const getFileMetaData = async (url: string) => {
  return await stat(url);
};
