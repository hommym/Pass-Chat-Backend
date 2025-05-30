import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { SavedContactsDto } from "../dtos/savedContactsDto";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import { contactsService } from "../../../common/constants/objects";
import { BlockContactDto } from "../dtos/blockContactDto";

export const contactsRouter = Router();

contactsRouter.post(
  "/save",
  bodyValidator(SavedContactsDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { contacts, verifiedUserId } = req.body;
    await contactsService.saveContacts(contacts, verifiedUserId);
    res.status(204).end();
  })
);

contactsRouter.get(
  "/save",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId } = req.body;
    res.status(200).json(await contactsService.getSavedContacts(verifiedUserId));
  })
);

contactsRouter.get(
  "/global",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId } = req.body;
    res.status(200).json(await contactsService.getGlobalContacts(verifiedUserId));
  })
);

contactsRouter.patch(
  "/block",
  bodyValidator(BlockContactDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...blockContactDto } = req.body;
    res.status(200).json(await contactsService.blockContact(verifiedUserId, blockContactDto));
  })
);
