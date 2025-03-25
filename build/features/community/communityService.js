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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
class CommunityService {
    async checkCommunity(type, name, ownerId) {
        return await objects_1.database.community.findUnique({ where: { type_ownerId_name: { name, type, ownerId } } });
    }
    async createCommunity(type, communityDto, ownerId) {
        const { name, description, visibility, profile } = communityDto;
        let permissions;
        let chatRoom;
        const community = await this.checkCommunity(type, name, ownerId);
        if (!community || (community === null || community === void 0 ? void 0 : community.deleteFlag)) {
            chatRoom = await objects_1.database.chatRoom.create({ data: { type, name } });
            if (type === "group") {
                permissions = {
                    messaging: "all",
                    mediaSharing: "all",
                    communitySharing: "all",
                    polls: "all",
                    pinning: "admins",
                    prevMessage: true,
                };
            }
            else {
                permissions = {
                    commenting: "all",
                    communitySharing: "all",
                };
            }
        }
        const communityDetails = await objects_1.database.community.upsert({
            where: { type_ownerId_name: { name, type, ownerId } },
            create: { name, type, description, visibility, permissions, profile, roomId: chatRoom ? chatRoom.id : 0, ownerId },
            update: (community === null || community === void 0 ? void 0 : community.deleteFlag) ? { name, type, description, visibility, profile, deleteFlag: false, permissions } : { name, type, description, visibility, profile },
        });
        await objects_1.database.community.update({ where: { id: communityDetails.id }, data: { invitationLink: `${process.env.BackendUrl}/community/${communityDetails.id}/join` } });
        await objects_1.database.communityMember.upsert({
            where: { communityId_userId: { communityId: communityDetails.id, userId: ownerId } },
            create: { communityId: communityDetails.id, userId: ownerId, role: "owner" },
            update: { deleteFlag: false },
        });
        return { communityDetails, memberShipType: "owner" };
    }
    async updatePermissions(ownerId, permissionsDto, type) {
        const { name } = permissionsDto, permissions = __rest(permissionsDto, ["name"]);
        if (!(await this.checkCommunity(type, name, ownerId)))
            throw new errorHandler_1.AppError(`This account does not own a ${type} with such name`, 404);
        return await objects_1.database.community.update({ where: { type_ownerId_name: { type, name, ownerId } }, data: { permissions } });
    }
    async search(keyword) {
        return await objects_1.database.community.findMany({
            where: { name: { startsWith: keyword }, visibility: "public", status: "active" },
        });
    }
    async updateCommunitySubCount(arg) {
        const { communityId, operation } = arg;
        if (operation === "add") {
            await objects_1.database.community.update({ where: { id: communityId }, data: { subscriberCount: { increment: 1 } } });
        }
        else {
            await objects_1.database.community.update({ where: { id: communityId }, data: { subscriberCount: { decrement: 1 } } });
        }
    }
    async isMember(communityId, userId) {
        return await objects_1.database.communityMember.findUnique({ where: { communityId_userId: { communityId, userId }, deleteFlag: false } });
    }
    async joinCommunity(communityId, userId) {
        const communityDetails = await objects_1.database.community.findUnique({ where: { id: communityId } });
        if (!communityDetails)
            throw new errorHandler_1.AppError(`No group or channel with this id exist`, 404);
        const { id } = communityDetails;
        if (await this.isMember(id, userId))
            throw new errorHandler_1.AppError("User is already a member", 409);
        else if (communityDetails.status !== "active")
            throw new errorHandler_1.AppError(`Cannot Join Banned or Suspended ${communityDetails.type}`, 401);
        const clientMembershipInfo = await objects_1.database.communityMember.create({ data: { userId, communityId: communityDetails.id } });
        objects_1.appEvents.emit("update-community-sub-count", { communityId, operation: "add" });
        return { communityDetails, memberShipType: clientMembershipInfo.role };
    }
    async exitCommunity(communityId, userId) {
        const communityDetails = await objects_1.database.community.findUnique({ where: { id: communityId } });
        if (!communityDetails)
            throw new errorHandler_1.AppError(`No group or channel with this id exist`, 404);
        else if (!(await this.isMember(communityId, userId)))
            throw new errorHandler_1.AppError("User is not a member", 409);
        await objects_1.database.communityMember.delete({ where: { communityId_userId: { communityId, userId } } });
        objects_1.appEvents.emit("update-community-sub-count", { communityId, operation: "sub" });
    }
    async updateMemberRole(type, communityName, ownerId, updatedData) {
        const { memberPhone, newRole } = updatedData;
        const communityDetails = await objects_1.database.community.findUnique({ where: { type_ownerId_name: { type, name: communityName, ownerId } } });
        if (!communityDetails)
            throw new errorHandler_1.AppError(`No ${type} with this name exist`, 404);
        else if (ownerId !== communityDetails.ownerId)
            throw new errorHandler_1.AppError(`Only the owner of the ${type} can change members roles`, 402);
        const { id, description, name, profile, subscriberCount } = communityDetails;
        const memberAccount = await objects_1.database.user.findUnique({ where: { phone: memberPhone } });
        if (!memberAccount)
            throw new errorHandler_1.AppError("No account with this phone exist", 404);
        else if (!(await this.isMember(communityDetails.id, memberAccount.id)))
            throw new errorHandler_1.AppError(`User is not a member of the ${type}`, 404);
        await objects_1.database.communityMember.update({ where: { communityId_userId: { communityId: communityDetails.id, userId: memberAccount.id } }, data: { role: newRole } });
    }
    async getAllUsersCommunities(userId) {
        // this method gets all communities a user is part of
        const allMemberShipData = await objects_1.database.communityMember.findMany({ where: { userId, deleteFlag: false } });
        return Promise.all(allMemberShipData.map(async (memberShipData) => {
            const communityDetails = await objects_1.database.community.findUnique({
                where: { id: memberShipData.communityId },
                include: { members: memberShipData.role === "owner" ? { select: { role: true, userDetails: { select: { phone: true, profile: true } } } } : false },
            });
            return { communityDetails, memberShipType: memberShipData.role };
        }));
    }
    async getCommunityDetailsForUser(userId, communityId) {
        // this method gets details of a specific community a user is a member of
        const memberShipInfo = await this.isMember(communityId, userId);
        if (!memberShipInfo)
            throw new errorHandler_1.AppError("User is not a member", 404);
        const communityDetails = await objects_1.database.community.findUnique({
            where: { id: memberShipInfo.communityId },
            include: { members: memberShipInfo.role === "owner", callRoom: { include: { participants: { include: { participant: { select: { profile: true, phone: true, username: true } } } } } } },
        });
        return { communityDetails, memberShipType: memberShipInfo.role };
    }
    async deleteCommunity(communityId, ownerId) {
        const memberShipDetails = await this.isMember(communityId, ownerId);
        if (!memberShipDetails || (memberShipDetails === null || memberShipDetails === void 0 ? void 0 : memberShipDetails.role) !== "owner")
            throw new errorHandler_1.AppError("Deletion Failed User Not Owner", 402);
        await objects_1.database.community.update({ where: { id: memberShipDetails.communityId }, data: { deleteFlag: true } });
        await objects_1.database.communityMember.updateMany({ where: { communityId: memberShipDetails.communityId }, data: { deleteFlag: true } });
        const allMembers = await objects_1.database.communityMember.findMany({ where: { communityId } });
        const membersIds = allMembers.map((member) => member.userId);
        objects_1.appEvents.emit("set-community-members-notifications", { communityId, membersIds, action: "deleteCommunity", platform: "mobile", messageId: null, chatRoomId: null });
    }
    async verifyCommunity(ownerId, verificationData) {
        const { communityId } = verificationData;
        const communityDetails = await objects_1.database.community.findUnique({ where: { id: communityId, ownerId } });
        if (!communityDetails)
            throw new errorHandler_1.AppError("No Community with such id exist or User is not the creator of this community", 404);
        else if (communityDetails.subscriberCount < 5000 && communityDetails.type === "group")
            throw new errorHandler_1.AppError("This Group does not meet the minimum members requirement", 401);
        else if (communityDetails.subscriberCount < 20000 && communityDetails.type === "channel")
            throw new errorHandler_1.AppError("This Channel does not meet the minimum members requirement", 401);
        else if ((await objects_1.database.communityVerification.findMany({ where: { communityId, status: "pending" } })).length !== 0)
            throw new errorHandler_1.AppError(`This ${communityDetails.type} is already under review for verification,cannot submit another until review process is done.`, 409);
        await objects_1.database.communityVerification.create({ data: verificationData });
        return { message: "Data Submited Successfully,Review Process takes 3 to 5 days to complete.An email will be sent to you after the decision is made." };
    }
}
exports.CommunityService = CommunityService;
