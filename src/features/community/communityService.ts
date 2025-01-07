import { Community } from "@prisma/client";
import { CreateCommunityDto } from "./dto/createCommunityDto";
import { database } from "../../common/constants/objects";
import { AppError } from "../../common/middlewares/errorHandler";

export class CommunityService {
  async checkCommunity(type: "channel" | "group", name: string) {
    return await database.community.findUnique({ where: { type_name: { name, type } } });
  }

  async createCommunity(type: "channel" | "group", communityDto: CreateCommunityDto, ownerId: number) {
    const { name, description, visibility, permissions, profile } = communityDto;

    if (await this.checkCommunity(type, name)) throw new AppError(`A ${type} with this name already exist`, 409);
    const chatRoom = await database.chatRoom.create({ data: { type, name } });

    if (type === "group" && !permissions) throw new AppError("No Value passed for permissions", 400);

    return await database.community.create({ data: { name, type, description, visibility, permissions: permissions as any, profile, roomId: chatRoom.id, ownerId } });
  }
}
