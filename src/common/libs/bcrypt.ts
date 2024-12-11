import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import { AppError } from "../middlewares/errorHandler";


export const encryptData = async (rawPassword: string): Promise<string> => {
  return await bcrypt.hash(rawPassword, Number(process.env.PasswordEncrptRounds!));
};

export const verifyEncryptedData = async (rawData: string, encryptedData: string) => {
  const isPasswordCorrect = await bcrypt.compare(rawData, encryptedData);
  if (!isPasswordCorrect) throw new AppError("Invalid password", 401);
};
