import { Request, Response, Router } from "express";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import asyncHandler from "express-async-handler";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { CreateStoryDto } from "../dtos/createStoryDto";
import { AppError } from "../../../common/middlewares/errorHandler";
import { postsService } from "../../../common/constants/objects";

export const postsRouter = Router();

postsRouter.post(
  "/story",
  bodyValidator(CreateStoryDto),
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { verifiedUserId, ...storyDto } = req.body;
    res.status(201).json(await postsService.createStory(storyDto, verifiedUserId));
  })
);

postsRouter.delete(
  "/story/:storyId",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    let storyId;
    const { verifiedUserId } = req.body;
    try {
      storyId = +req.params.storyId;
    } catch (error) {
      throw new AppError("The Url parameter storyId must be an integer", 400);
    }
    // code for handling deletion
    await postsService.deleteStory(storyId, verifiedUserId);
    res.status(204).end();
  })
);
