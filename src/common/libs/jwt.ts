import dotenv from "dotenv";
dotenv.config();
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../middlewares/errorHandler";

export const jwtForLogIn = (id: string|number,exp:string|null=null): string => {
  if (process.env.JwtSecretKey !== undefined) {
    return jwt.sign({ userId: id }, process.env.JwtSecretKey, { expiresIn:exp?exp:"36500d" });
  } else {
    console.log("env variable JwtSecretKey not defined on server");
    throw new AppError("Server errror", 500);
  }
};

export const verifyJwtToken = (token: string)=> {
  if (process.env.JwtSecretKey !== undefined) {
    return jwt.verify(token, process.env.JwtSecretKey);
  } else {
    throw new AppError("env variable JwtSecretKey not defined on server", 500);
  }
};

export const jwtForOtp = (otpCode: number | string): string => {
  if (process.env.JwtSecretKey !== undefined) {
    return jwt.sign({ otpCode }, process.env.JwtSecretKey, { expiresIn: 300000 });
  } else {
    console.log("env variable JwtSecretKey not defined on server");
    throw new AppError("Server errror", 500);
  }
};


