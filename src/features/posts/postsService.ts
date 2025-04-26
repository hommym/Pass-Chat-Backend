import { appEvents, database, jobManager } from "../../common/constants/objects";
import { getCurrentDate, getNextDayDate } from "../../common/helpers/date";
import { AppError } from "../../common/middlewares/errorHandler";
import { CreateStoryDto } from "./dtos/createStoryDto";

export class PostsService {
  async createStory(createStoryDto: CreateStoryDto, ownerId: number) {
    const { content, postType, exclude } = createStoryDto;
    const dateForRemoval = getNextDayDate(getCurrentDate(true));
    const ownerDetails = await database.user.findUnique({ where: { id: ownerId }, select: { phone: true } });
    //save the post
    const story = await database.story.create({ data: { content, ownerId, exclude, type: postType }, omit: { exclude: true, ownerId: true } });

    // get users contact
    const contacts = (await database.userContact.findMany({ where: { ownerId, phone: { notIn: exclude } }, select: { phone: true } })).map((item) => item.phone);

    //alert all contacts of user about the story exluding contacts which was set in the body
    appEvents.emit("story-update", { action: "add", contacts, story, ownerPhone: ownerDetails!.phone! });

    //schedule the removal task
    const storyRemovalHandler = async () => {
      console.log("A Job is being executed");
      await database.story.delete({ where: { id: story.id } });
      appEvents.emit("story-update", { action: "remove", contacts, story, ownerPhone: ownerDetails!.phone! });
    };

    jobManager.addJob("storyAutoRemoval", { jobId: story.id, callBack: storyRemovalHandler, executionDate: dateForRemoval });

    return { ownerPhone: ownerDetails!.phone, story };
  }

  async deleteStory(storyId: number, ownerId: number) {
    try {
      const story = await database.story.delete({ where: { id: storyId, ownerId }, omit: { ownerId: true } });
      const ownerDetails = await database.user.findUnique({ where: { id: ownerId }, select: { phone: true } });
      const contacts = (await database.userContact.findMany({ where: { ownerId, phone: { notIn: story.exclude as string[] } }, select: { phone: true } })).map((item) => item.phone);
      const wasJobCancelled = jobManager.removeJob(storyId);

      if (wasJobCancelled) {
        const {exclude,...storyWithoutExclude}=story
        appEvents.emit("story-update", { action: "remove", contacts, story:storyWithoutExclude, ownerPhone: ownerDetails!.phone! });
      }
    } catch (error) {
      throw new AppError("Story not found or you are not the owner", 404);
    }
  }
}
