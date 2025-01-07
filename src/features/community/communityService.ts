import { ChatRoom, Community } from "@prisma/client";
import { CreateCommunityDto } from "./dto/createCommunityDto";
import { database } from "../../common/constants/objects";
import { AppError } from "../../common/middlewares/errorHandler";

export class CommunityService {
  async checkCommunity(type: "channel" | "group", name: string, ownerId: number) {
    return await database.community.findUnique({ where: { type_name: { name, type }, ownerId } });
  }

  async createCommunity(type: "channel" | "group", communityDto: CreateCommunityDto, ownerId: number) {
    const { name, description, visibility, profile } = communityDto;
    let permissions: any;
    let chatRoom: ChatRoom;
    if (!(await this.checkCommunity(type, name, ownerId))) {
      chatRoom = await database.chatRoom.create({ data: { type, name } });
      if (type === "group") {
        permissions = {
          messaging: "all",
          mediaSharing: "all",
          communitySharing: "all",
          polls: "all",
          pinning: "admins",
        };
      }
    }
    return await database.community.upsert({
      where: { type_name: { name, type }, ownerId },
      create: { name, type, description, visibility, permissions, profile, roomId: chatRoom!?chatRoom.id:0, ownerId },
      update: { name, type, description, visibility, profile },
    });
  }
}
