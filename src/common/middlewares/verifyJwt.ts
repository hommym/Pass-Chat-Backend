// Custom data types
import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { AppError } from "./errorHandler";
import { verifyJwtToken } from "../libs/jwt";
import { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";
import { chatService} from "../constants/objects";
import { SocketV1 } from "../helpers/classes/socketV1";

export const verifyJwt = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // console.log("Jwt verification began....");
  if (req.headers !== undefined && req.headers.authorization !== undefined) {
    if (!req.headers.authorization.startsWith("Bearer ")) {
      res.status(400);
      throw new AppError("Bad Request Bearer schema not found in Header", 400);
    }

    try {
      const jwtData = verifyJwtToken(req.headers.authorization.split(" ")[1]) as JwtPayload;
      //  if (!jwtData.userId) {
      //    throw new AppError("Token has expired or is not valid", 401);
      //  }
      //  console.log("Jwt token Verified");
      req.body.verifiedUserId = jwtData.userId;
      next();
    } catch (error) {
      throw new AppError("Token has expired or is not valid", 401);
    }
  } else {
    throw new AppError("Authorization Header not defined", 400);
  }
});

export const verifyJwtForWs = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token ? socket.handshake.auth?.token : socket.handshake.headers.authorization?.split(" ")[1];

  if (!token) {
    next(new Error("No Auth Token Provided"));
  }

  try {
    const jwtData = verifyJwtToken(token) as JwtPayload;
    // adding usrs to online users
    const userId = jwtData.userId;
    await chatService.setUserOnlineStatus("online", userId, socket.id);
    (socket as SocketV1).authUserId = userId;
    console.log(`User Verified id=${jwtData.userId}`);
    next();
  } catch (error) {
    next(error as Error);
  }
};
