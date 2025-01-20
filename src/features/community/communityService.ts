import dotenv from "dotenv";
dotenv.config();
import { ChatRoom, Community, CommunityRole } from "@prisma/client";
import { CreateCommunityDto } from "./dto/createCommunityDto";
import { appEvents, authService, database } from "../../common/constants/objects";
import { AppError } from "../../common/middlewares/errorHandler";
import { GroupPermissionsDto } from "./dto/permissionsDto";
import { UpdateRoleDto } from "./dto/updateRoleDto";

export class CommunityService {
  async checkCommunity(type: "channel" | "group", name: string, ownerId: number) {
    return await database.community.findUnique({ where: { type_name: { name, type }, ownerId} });
  }

  async createCommunity(type: "channel" | "group", communityDto: CreateCommunityDto, ownerId: number) {
    const { name, description, visibility, profile } = communityDto;
    let permissions: any;
    let chatRoom: ChatRoom;
    const community = await this.checkCommunity(type, name, ownerId);
    if (!community || community?.deleteFlag) {
      chatRoom = await database.chatRoom.create({ data: { type, name } });
      if (type === "group") {
        permissions = {
          messaging: "all",
          mediaSharing: "all",
          communitySharing: "all",
          polls: "all",
          pinning: "admins",
          prevMessage: true,
        };
      } else {
        permissions = {
          commenting: "all",
          communitySharing: "all",
        };
      }
    }
    const communityDetails = await database.community.upsert({
      where: { type_name: { name, type }, ownerId },
      create: { name, type, description, visibility, permissions, profile, roomId: chatRoom! ? chatRoom.id : 0, ownerId, invitationLink: `${process.env.BackendUrl}/community/${type}/${name}/join` },
      update: community?.deleteFlag ? { name, type, description, visibility, profile, deleteFlag: false, permissions } : { name, type, description, visibility, profile },
    });

    await database.communityMember.upsert({
      where: { communityId_userId: { communityId: communityDetails.id, userId: ownerId } },
      create: { communityId: communityDetails.id, userId: ownerId, role: "owner" },
      update: { deleteFlag: false },
    });

    return { communityDetails, memberShipType: "owner" };
  }

  async updatePermissions(ownerId: number, permissionsDto: GroupPermissionsDto, type: "group" | "channel") {
    const { name, ...permissions } = permissionsDto;
    if (!(await this.checkCommunity(type, name, ownerId))) throw new AppError(`This account does not own a ${type} with such name`, 404);
    return await database.community.update({ where: { type_name: { type, name }, ownerId }, data: { permissions } });
  }

  async search(keyword: string) {
    return await database.community.findMany({
      where: { name: { startsWith: keyword }, visibility: "public" },
    });
  }

  async updateCommunitySubCount(arg: { operation: "add" | "sub"; communityId: number }) {
    const { communityId, operation } = arg;
    if (operation === "add") {
      await database.community.update({ where: { id: communityId }, data: { subscriberCount: { increment: 1 } } });
    } else {
      await database.community.update({ where: { id: communityId }, data: { subscriberCount: { decrement: 1 } } });
    }
  }

  async isMember(communityId: number, userId: number) {
    return await database.communityMember.findUnique({ where: { communityId_userId: { communityId, userId }, deleteFlag: false } });
  }

  async joinCommunity(type: "channel" | "group", communityName: string, userId: number) {
    const communityDetails = await database.community.findUnique({ where: { type_name: { type, name: communityName } } });

    if (!communityDetails) throw new AppError(`No ${type} with this name exist`, 404);
    const { id, description, name, profile, subscriberCount } = communityDetails;

    if (await this.isMember(id, userId)) throw new AppError("User is already a member", 409);

    const clientMembershipInfo = await database.communityMember.create({ data: { userId, communityId: communityDetails.id } });

    appEvents.emit("update-community-sub-count", { communityId: id, operation: "add" });
    return { communityDetails, memberShipType: clientMembershipInfo.role };
  }

  async exitCommunity(type: "channel" | "group", communityName: string, userId: number) {
    const communityDetails = await database.community.findUnique({ where: { type_name: { type, name: communityName } } });
    if (!communityDetails) throw new AppError(`No ${type} with this name exist`, 404);
    const { id } = communityDetails;
    await database.communityMember.delete({ where: { communityId_userId: { communityId: id, userId } } });
    appEvents.emit("update-community-sub-count", { communityId: id, operation: "sub" });
  }

  async updateMemberRole(type: "channel" | "group", communityName: string, ownerId: number, updatedData: UpdateRoleDto) {
    const { memberPhone, newRole } = updatedData;
    const communityDetails = await database.community.findUnique({ where: { type_name: { type, name: communityName } } });

    if (!communityDetails) throw new AppError(`No ${type} with this name exist`, 404);
    else if (ownerId !== communityDetails.ownerId) throw new AppError(`Only the owner of the ${type} can change members roles`, 402);
    const { id, description, name, profile, subscriberCount } = communityDetails;

    const memberAccount = await database.user.findUnique({ where: { phone: memberPhone } });

    if (!memberAccount) throw new AppError("No account with this phone exist", 404);
    else if (!(await this.isMember(communityDetails.id, memberAccount.id))) throw new AppError(`User is not a member of the ${type}`, 404);

    await database.communityMember.update({ where: { communityId_userId: { communityId: communityDetails.id, userId: memberAccount.id } }, data: { role: newRole } });
  }

  async getAllUsersCommunities(userId: number) {
    // this method gets all communities a user is part of
    const allMemberShipData = await database.communityMember.findMany({ where: { userId, deleteFlag: false } });
    return Promise.all(
      allMemberShipData.map(async (memberShipData) => {
        const communityDetails = await database.community.findUnique({ where: { id: memberShipData.communityId }, include: { members: memberShipData.role === "owner" } });
        return { communityDetails, memberShipType: memberShipData.role };
      })
    );
  }

  async getCommunityDetailsForUser(userId: number, communityId: number) {
    // this method gets details of a specific community a user is a member of

    const memberShipInfo = await this.isMember(communityId, userId);
    if (!memberShipInfo) throw new AppError("User is not a member", 404);
    const communityDetails = await database.community.findUnique({ where: { id: memberShipInfo.communityId }, include: { members: memberShipInfo.role === "owner" } });

    return { communityDetails, memberShipType: memberShipInfo.role };
  }

  async deleteCommunity(communityId: number, ownerId: number) {
    const memberShipDetails = await this.isMember(communityId, ownerId);
    if (!memberShipDetails || memberShipDetails?.role !== "owner") throw new AppError("Deletion Failed User Not Owner", 402);

    await database.community.update({ where: { id: memberShipDetails.communityId }, data: { deleteFlag: true } });
    await database.communityMember.updateMany({ where: { communityId: memberShipDetails.communityId }, data: { deleteFlag: true } });

    const allMembers = await database.communityMember.findMany({ where: { communityId } });

    const membersIds = allMembers.map((member) => member.userId);

    appEvents.emit("set-community-members-notifications", { communityId, membersIds, action: "deleteCommunity", platform: "mobile", messageId: null });
  }
}
