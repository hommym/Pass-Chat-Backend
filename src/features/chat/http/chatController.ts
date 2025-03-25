import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { ChatRoomDto } from "../dto/chatRoomDto";
import { chatService } from "../../../common/constants/objects";
import { UpdateMessageDto } from "../dto/updateMessageDto";
import { AppError } from "../../../common/middlewares/errorHandler";

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

chatRouter.patch(
  "/message",
  bodyValidator(UpdateMessageDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...messageData } = req.body;
    const webUser = req.params.webUser ? true : false; // for differentiating between web and mobile request
    await chatService.updateMessage(verifiedUserId, messageData, webUser);
    res.status(204).end();
  })
);

chatRouter.delete(
  "/message",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, messageId } = req.body;
    const webUser = req.params.webUser ? true : false;
    if (!messageId) throw new AppError("No value passed for messageId", 400);
    await chatService.deleteMessage(+messageId, verifiedUserId, webUser);
    res.status(204).end();
  })
);

chatRouter.patch(
  "/pin/message/:messageId",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
     const { verifiedUserId } = req.body;
    try {
      res.status(200).json(await chatService.pinMessage(+messageId,verifiedUserId));
    } catch (error) {
      if (error instanceof AppError) throw error;
      else throw new AppError("Url parameter messageId should be an integer", 400);
    }
  })
);
