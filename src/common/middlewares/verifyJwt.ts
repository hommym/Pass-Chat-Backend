// Custom data types
import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { AppError, WsError } from "./errorHandler";
import { verifyJwtToken } from "../libs/jwt";
import { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";
import { appEvents, authService, chatService, database } from "../constants/objects";
import { SocketV1 } from "../helpers/classes/socketV1";
import { OS } from "@prisma/client";

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

      // the if statement is temporary
      if (!(await database.user.findUnique({ where: { id: jwtData.userId } }))) throw new AppError("", 404);
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
  const setOnlineStatus = socket.handshake.query.setOnlineStatus;
  const platform = socket.handshake.query.platform && ["ios", "desktop", "android"].includes(socket.handshake.query.platform as string) ? (socket.handshake.query.platform as OS) : "android";
  const timezone = socket.handshake.query.timezone ? (socket.handshake.query.timezone as string) : "Africa/Acrra";
  const isWebUser = socket.handshake.query.webUser ? true : false;
  if (!token) {
    next(new Error("No Auth Token Provided"));
  }
  try {
    const jwtData = verifyJwtToken(token) as JwtPayload;
    // adding usrs to online users
    const userId = jwtData.userId;

    // checking if user is already online
    if (setOnlineStatus) {
      const userDetails = await database.user.findUnique({ where: { id: userId } });

      if (userDetails === null) return next(new WsError(`NO account with such id exist`));
      else if (userDetails.status !== "active") return next(new WsError(`Account has been ${userDetails!.status}`));
      else if ((userDetails.onlineStatus !== "offline" && !isWebUser) || (userDetails.onlineStatusWeb !== "offline" && isWebUser)) return next(new WsError("User Already Online"));

      await chatService.setUserOnlineStatus("online", userId, socket.id, isWebUser);
      appEvents.emit("add-to-daily-users", { userId, platform, timezone });
    }
    (socket as SocketV1).authUserId = userId;
    (socket as SocketV1).isWebUser = isWebUser;
    console.log(`User Verified id=${jwtData.userId}`);
    next();
  } catch (error) {
    next(error as Error);
  }
};
