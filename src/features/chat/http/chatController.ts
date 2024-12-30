import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { ChatRoomDto } from "../dto/chatRoomDto";
import { chatService } from "../../../common/constants/objects";

export const chatRouter = Router();

chatRouter.post(
  "/room",
  verifyJwt,
  bodyValidator(ChatRoomDto),
  asyncHandler(async (req: Request, res: Response) => {
    const { user1Phone, user2Phone } = req.body as ChatRoomDto;
    res.status(201).json(await chatService.creatChatRoomDeatils(user1Phone, user2Phone));
  })
);

chatRouter.get(
  "/room",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId } = req.body;
    res.status(201).json(await chatService.getAllChatRooms(verifiedUserId));
  })
);
