import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { ChatRoomDto } from "../dto/chatRoomDto";
import { chatService } from "../../../common/constants/objects";
import { UpdateMessageDto } from "../dto/updateMessageDto";
import { AppError } from "../../../common/middlewares/errorHandler";
import { DeleteMessageDto } from "../dto/deleteMessageDto";
import { ClearChatDto } from "../dto/clearChatsDto";

export const chatRouter = Router();

chatRouter.post(
  "/room",
  bodyValidator(ChatRoomDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...phoneNumbers } = req.body;
    const { user1Phone, user2Phone } = phoneNumbers as ChatRoomDto;
    res.status(201).json(await chatService.creatChatRoomDeatils(user1Phone, user2Phone, verifiedUserId));
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
  bodyValidator(DeleteMessageDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, messageId, deleteFlag } = req.body;
    const webUser = req.params.webUser ? true : false;
    if (!messageId) throw new AppError("No value passed for messageId", 400);
    await chatService.deleteMessage(+messageId, verifiedUserId, deleteFlag, webUser);
    res.status(204).end();
  })
);

chatRouter.patch(
  "/:pinType/message/:messageId",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { messageId, pinType } = req.params;
    const { verifiedUserId } = req.body;

    if (!["pin", "unpin"].includes(pinType)) throw new AppError("Url parameter pinType must be of the values pin or unpin", 400);

    try {
      res.status(200).json(await chatService.pinMessage(+messageId, verifiedUserId, pinType as "pin" | "unpin"));
    } catch (error) {
      if (error instanceof AppError) throw error;
      else throw new AppError("Url parameter messageId should be an integer", 400);
    }
  })
);

chatRouter.delete(
  "/clear-all-chats",
  bodyValidator(ClearChatDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...clearChatDto } = req.body;
    await chatService.clearAllChats(clearChatDto, verifiedUserId);
    res.status(204).end();
  })
);
