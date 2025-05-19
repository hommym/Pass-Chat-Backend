"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const objects_1 = require("../../common/constants/objects");
const date_1 = require("../../common/helpers/date");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
class PostsService {
    async createStory(createStoryDto, ownerId) {
        const { content, postType, exclude } = createStoryDto;
        const dateForRemoval = (0, date_1.getNextDayDate)((0, date_1.getCurrentDate)(true));
        const ownerDetails = await objects_1.database.user.findUnique({ where: { id: ownerId }, select: { phone: true } });
        //save the post
        const story = await objects_1.database.story.create({ data: { content, ownerId, exclude, type: postType }, omit: { exclude: true, ownerId: true } });
        // get users contact
        const contacts = (await objects_1.database.userContact.findMany({ where: { ownerId, phone: { notIn: exclude } }, select: { phone: true } })).map((item) => item.phone);
        //alert all contacts of user about the story exluding contacts which was set in the body
        objects_1.appEvents.emit("story-update", { action: "add", contacts, story, ownerPhone: ownerDetails.phone });
        //schedule the removal task
        const storyRemovalHandler = async () => {
            console.log("A Job is being executed");
            await objects_1.database.story.delete({ where: { id: story.id } });
            objects_1.appEvents.emit("story-update", { action: "remove", contacts, story, ownerPhone: ownerDetails.phone });
        };
        objects_1.jobManager.addJob("storyAutoRemoval", { jobId: story.id, callBack: storyRemovalHandler, executionDate: dateForRemoval });
        return { ownerPhone: ownerDetails.phone, story };
    }
    async deleteStory(storyId, ownerId) {
        try {
            const story = await objects_1.database.story.delete({ where: { id: storyId, ownerId }, omit: { ownerId: true } });
            const ownerDetails = await objects_1.database.user.findUnique({ where: { id: ownerId }, select: { phone: true } });
            const contacts = (await objects_1.database.userContact.findMany({ where: { ownerId, phone: { notIn: story.exclude } }, select: { phone: true } })).map((item) => item.phone);
            const wasJobCancelled = objects_1.jobManager.removeJob(storyId);
            if (wasJobCancelled) {
                const { exclude } = story, storyWithoutExclude = __rest(story, ["exclude"]);
                objects_1.appEvents.emit("story-update", { action: "remove", contacts, story: storyWithoutExclude, ownerPhone: ownerDetails.phone });
            }
        }
        catch (error) {
            throw new errorHandler_1.AppError("Story not found or you are not the owner", 404);
        }
    }
    async getStories(socket) {
        // this method gets all stories of a user and his contact
        let { phone } = (await objects_1.database.user.findUnique({ where: { id: socket.authUserId } }));
        const accountsToRetrieveStoriesFrom = [socket.authUserId];
        const listOfPhones = (await objects_1.database.userContact.findMany({ where: { ownerId: socket.authUserId }, select: { phone: true, user: true } })).map((contact) => contact.phone);
        (await objects_1.database.user.findMany({ where: { phone: { in: listOfPhones } }, select: { id: true } })).forEach((user) => accountsToRetrieveStoriesFrom.push(user.id));
        const storiesAvialable = await objects_1.database.story.findMany({ where: { ownerId: { in: accountsToRetrieveStoriesFrom } }, omit: { ownerId: true }, include: { owner: { select: { phone: true } } } });
        const storiesToSend = [];
        for (let story of storiesAvialable) {
            if (story.exclude) {
                if (story.exclude.includes(phone))
                    continue;
            }
            const { exclude, owner } = story, storyOnly = __rest(story, ["exclude", "owner"]);
            storiesToSend.push({ ownerPhone: owner.phone, story: storyOnly });
        }
        socket.emit("response", { action: "getStory", stories: storiesToSend });
    }
}
exports.PostsService = PostsService;
