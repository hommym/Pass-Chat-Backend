import fs, { access } from "fs/promises";

export const checkPathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, fs.constants.F_OK);
    // console.log("Path exists.");
    return true;
  } catch (err) {
    // console.log("Path does not exist.");
    return false;
  }
};
