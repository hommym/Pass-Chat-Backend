import dotenv from "dotenv";
dotenv.config();
import { ChatRoom, Community, CommunityRole } from "@prisma/client";
import { CreateCommunityDto } from "./dto/createCommunityDto";
import { appEvents, authService, database } from "../../common/constants/objects";
import { AppError } from "../../common/middlewares/errorHandler";
import { GroupPermissionsDto } from "./dto/permissionsDto";
import { UpdateRoleDto } from "./dto/updateRoleDto";
import { VerifyCommunityDto } from "./dto/verifyCommunityDto";

export class CommunityService {
  async checkCommunity(type: "channel" | "group", name: string, ownerId: number) {
    return await database.community.findUnique({ where: { type_ownerId_name: { name, type, ownerId } } });
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
      where: { type_ownerId_name: { name, type, ownerId } },
      create: { name, type, description, visibility, permissions, profile, roomId: chatRoom! ? chatRoom.id : 0, ownerId },
      update: community?.deleteFlag ? { name, type, description, visibility, profile, deleteFlag: false, permissions } : { name, type, description, visibility, profile },
    });

    await database.community.update({ where: { id: communityDetails.id }, data: { invitationLink: `${process.env.BackendUrl}/community/${communityDetails.id}/join` } });

    await database.communityMember.upsert({
      where: { communityId_userId: { communityId: communityDetails.id, userId: ownerId } },
      create: { communityId: communityDetails.id, userId: ownerId, role: "owner" },
      update: { deleteFlag: false },
    });

    return { communityDetails, memberShipType: "owner" };
  }

  async updatePermissions(ownerId: number, permissionsDto: GroupPermissionsDto, type: "group" | "channel") {
    const { name, ...permissions } = permissionsDto;
    const doesUserOwnCommunity = await this.checkCommunity(type, name, ownerId);

    if (!doesUserOwnCommunity) throw new AppError(`This account does not own a ${type} with such name`, 404);

    await database.community.update({ where: { type_ownerId_name: { type, name, ownerId } }, data: { permissions } });

    const communityMembers = await database.communityMember.findMany({ where: { communityId: doesUserOwnCommunity.id } });
    const membersIds = communityMembers.map((member) => member.userId);

    appEvents.emit("set-community-members-notifications", { action: "comunityInfoUpdate", communityId: doesUserOwnCommunity.id, membersIds, messageId: null, platform: "mobile", chatRoomId: null });
  }

  async search(keyword: string) {
    return await database.community.findMany({
      where: { name: { startsWith: keyword }, visibility: "public", status: "active" },
    });
  }

  async updateCommunitySubCount(arg: { operation: "add" | "sub"; communityId: number }) {
    const { communityId, operation } = arg;
    if (operation === "add") {
      await database.community.update({ where: { id: communityId }, data: { subscriberCount: { increment: 1 } } });
    } else {
      await database.community.update({ where: { id: communityId }, data: { subscriberCount: { decrement: 1 } } });
    }

    const communityMembers = await database.communityMember.findMany({ where: { communityId } });
    const membersIds = communityMembers.map((member) => member.userId);
    appEvents.emit("set-community-members-notifications", { action: "comunityInfoUpdate", communityId, membersIds, messageId: null, platform: "mobile", chatRoomId: null });
  }

  async isMember(communityId: number, userId: number) {
    return await database.communityMember.findUnique({ where: { communityId_userId: { communityId, userId }, deleteFlag: false } });
  }

  async joinCommunity(communityId: number, userId: number) {
    const communityDetails = await database.community.findUnique({ where: { id: communityId } });

    if (!communityDetails) throw new AppError(`No group or channel with this id exist`, 404);
    const { id } = communityDetails;

    if (await this.isMember(id, userId)) throw new AppError("User is already a member", 409);
    else if (communityDetails.status !== "active") throw new AppError(`Cannot Join Banned or Suspended ${communityDetails.type}`, 401);

    const clientMembershipInfo = await database.communityMember.create({ data: { userId, communityId: communityDetails.id } });

    appEvents.emit("update-community-sub-count", { communityId, operation: "add" });
    return { communityDetails, memberShipType: clientMembershipInfo.role };
  }

  async exitCommunity(communityId: number, userId: number) {
    const communityDetails = await database.community.findUnique({ where: { id: communityId } });
    if (!communityDetails) throw new AppError(`No group or channel with this id exist`, 404);
    else if (!(await this.isMember(communityId, userId))) throw new AppError("User is not a member", 409);
    await database.communityMember.delete({ where: { communityId_userId: { communityId, userId } } });
    appEvents.emit("update-community-sub-count", { communityId, operation: "sub" });
  }

  async updateMemberRole(type: "channel" | "group", communityName: string, ownerId: number, updatedData: UpdateRoleDto) {
    const { memberPhone, newRole } = updatedData;
    const communityDetails = await database.community.findUnique({ where: { type_ownerId_name: { type, name: communityName, ownerId } } });

    if (!communityDetails) throw new AppError(`No ${type} with this name exist`, 404);
    else if (ownerId !== communityDetails.ownerId) throw new AppError(`Only the owner of the ${type} can change members roles`, 402);
    const { id} = communityDetails;

    const memberAccount = await database.user.findUnique({ where: { phone: memberPhone } });

    if (!memberAccount) throw new AppError("No account with this phone exist", 404);
    else if (!(await this.isMember(communityDetails.id, memberAccount.id))) throw new AppError(`User is not a member of the ${type}`, 404);

    await database.communityMember.update({ where: { communityId_userId: { communityId: id, userId: memberAccount.id } }, data: { role: newRole } });

    
    const membersIds = [ownerId, memberAccount.id];
    appEvents.emit("set-community-members-notifications", { action: "comunityInfoUpdate", communityId:id, membersIds, messageId: null, platform: "mobile", chatRoomId: null });
  }

  async getAllUsersCommunities(userId: number) {
    // this method gets all communities a user is part of
    const allMemberShipData = await database.communityMember.findMany({ where: { userId, deleteFlag: false } });
    return Promise.all(
      allMemberShipData.map(async (memberShipData) => {
        const communityDetails = await database.community.findUnique({
          where: { id: memberShipData.communityId },
          include: { members: { select: { role: true, userDetails: { select: { phone: true, profile: true } } } } },
        });
        if (memberShipData.role !== "owner") {
          communityDetails!.members = [];
        }
        return { communityDetails, memberShipType: memberShipData.role };
      })
    );
  }

  async getCommunityDetailsForUser(userId: number, communityId: number) {
    // this method gets details of a specific community a user is a member of

    const memberShipInfo = await this.isMember(communityId, userId);
    if (!memberShipInfo) throw new AppError("User is not a member", 404);
    const communityDetails = await database.community.findUnique({
      where: { id: memberShipInfo.communityId },
      include: { members: memberShipInfo.role === "owner", callRoom: { include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } } } },
    });

    return { communityDetails, memberShipType: memberShipInfo.role };
  }

  async deleteCommunity(communityId: number, ownerId: number) {
    const memberShipDetails = await this.isMember(communityId, ownerId);
    if (!memberShipDetails || memberShipDetails?.role !== "owner") throw new AppError("Deletion Failed User Not Owner", 402);

    await database.community.update({ where: { id: memberShipDetails.communityId }, data: { deleteFlag: true } });
    await database.communityMember.updateMany({ where: { communityId: memberShipDetails.communityId }, data: { deleteFlag: true } });

    const allMembers = await database.communityMember.findMany({ where: { communityId } });

    const membersIds = allMembers.map((member) => member.userId);

    appEvents.emit("set-community-members-notifications", { communityId, membersIds, action: "deleteCommunity", platform: "mobile", messageId: null, chatRoomId: null });
  }

  async verifyCommunity(ownerId: number, verificationData: VerifyCommunityDto) {
    const { communityId } = verificationData;
    const communityDetails = await database.community.findUnique({ where: { id: communityId, ownerId } });

    if (!communityDetails) throw new AppError("No Community with such id exist or User is not the creator of this community", 404);
    else if (communityDetails.subscriberCount < 5000 && communityDetails.type === "group") throw new AppError("This Group does not meet the minimum members requirement", 401);
    else if (communityDetails.subscriberCount < 20000 && communityDetails.type === "channel") throw new AppError("This Channel does not meet the minimum members requirement", 401);
    else if ((await database.communityVerification.findMany({ where: { communityId, status: "pending" } })).length !== 0)
      throw new AppError(`This ${communityDetails.type} is already under review for verification,cannot submit another until review process is done.`, 409);
    await database.communityVerification.create({ data: verificationData });
    return { message: "Data Submited Successfully,Review Process takes 3 to 5 days to complete.An email will be sent to you after the decision is made." };
  }
}
