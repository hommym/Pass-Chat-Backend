import dotenv from "dotenv";
dotenv.config();
import { CommunityType, OS, User } from "@prisma/client";
import { appEvents, database } from "../../common/constants/objects";
import { getCurrentDate, getYesterdayDate } from "../../common/helpers/date";
import { UpdateCommunityVerificationStatus } from "./dto/updateCommunityVerficationStatusDto";
import { AppError } from "../../common/middlewares/errorHandler";
import { join } from "path";
import { exec } from "child_process";
import { Response } from "express";
import { execAsync } from "../../common/helpers/classes/asyncCmd";

export class DashboardService {
  async addToDailyUsers(args: { userId: number; platform: OS; timezone: string }) {
    const { userId, platform, timezone } = args;
    const currentDate = getCurrentDate();
    await database.dailyUser.upsert({ where: { userId_date: { userId, date: currentDate } }, create: { userId, date: currentDate, platform, timezone }, update: {} });
  }

  async addToActiveCommunities(args: { communityId: number; userId: number; type: CommunityType }) {
    try {
      const { communityId, userId, type } = args;
      const currentDate = getCurrentDate();
      await database.dailyCommunityEngagement.create({ data: { communityId, userId, date: currentDate } });
      await database.activeCommunity.upsert({
        where: { communityId_date: { communityId, date: currentDate } },
        create: { communityId, date: currentDate, type },
        update: { numberOfEngagement: { increment: 1 } },
      });
    } catch (error) {
      // console.log("User")
    }
  }

  async getNumberOfDailyData(dataType: "users" | "activeCommunities" | "flaggedMessage" | "bannedAccounts") {
    const currentDate = getCurrentDate();
    const yesterdayDate = getYesterdayDate(currentDate);

    const currentDailyData =
      dataType === "users"
        ? (await database.dailyUser.findMany({ where: { date: currentDate } })).length
        : dataType === "flaggedMessage"
        ? (await database.flaggedData.findMany({ where: { date: currentDate, type: "message" } })).length
        : dataType === "bannedAccounts"
        ? (await database.flaggedData.findMany({ where: { date: currentDate, type: "account" } })).length
        : (await database.activeCommunity.findMany({ where: { date: currentDate } })).length;
    const yesterdayDailyData =
      dataType === "users" ? (await database.dailyUser.findMany({ where: { date: yesterdayDate } })).length : (await database.activeCommunity.findMany({ where: { date: yesterdayDate } })).length;

    if (yesterdayDailyData === 0) {
      // Handle the case where yesterday's data is 0
      if (currentDailyData > 0) {
        return {
          dailyTotal: currentDailyData,
          percentageChange: "100%",
          increment: true,
          decrement: false,
          same: false,
        };
      } else if (currentDailyData < 0) {
        return {
          dailyTotal: currentDailyData,
          percentageChange: "100%",
          decrement: true,
          same: false,
          increment: false,
        };
      } else {
        return {
          dailyTotal: currentDailyData,
          percentageChange: "0%",
          same: true,
          increment: false,
          decrement: false,
        };
      }
    } else {
      // General case when yesterdayDailyData is not zero
      const percentageChange = ((currentDailyData - yesterdayDailyData) * 100) / yesterdayDailyData;
      if (percentageChange > 0) {
        return {
          dailyTotal: currentDailyData,
          percentageChange: `${percentageChange.toFixed(2)}%`,
          increment: true,
          decrement: false,
          same: false,
        };
      } else if (percentageChange < 0) {
        return {
          dailyTotal: currentDailyData,
          percentageChange: `${Math.abs(percentageChange).toFixed(2)}%`,
          decrement: true,
          same: false,
          increment: false,
        };
      } else {
        return {
          dailyTotal: currentDailyData,
          percentageChange: "0%",
          same: true,
          increment: false,
          decrement: false,
        };
      }
    }
  }

  async getUserGrowthTrend(year: number) {
    return await database.dailyUser.findMany({ where: { date: { startsWith: `${year}` } } });
  }

  async getAllPendingComunityVerfRequests() {
    return await database.communityVerification.findMany({ where: { status: "pending" } });
  }

  async updateCommunityVerificationStatus(data: UpdateCommunityVerificationStatus) {
    const { action, verificationRequestId, reason } = data;

    const verificationRequest = await database.communityVerification.findUnique({ where: { id: verificationRequestId }, include: { community: true } });

    if (!verificationRequest) throw new AppError("No Verification Request with this Id exist", 404);

    const { community, contact } = verificationRequest;
    if (action === "accept") {
      await database.community.update({ where: { id: verificationRequest.communityId }, data: { isVerified: true } });
      //send congratulation email
      appEvents.emit("community-verification-email", { action: "accepted", communityName: community.name, email: contact, reason, type: community.type });
    } else {
      // send apologetic email
      appEvents.emit("community-verification-email", { action: "declined", communityName: community.name, email: contact, reason, type: community.type });
    }

    await database.communityVerification.update({ where: { id: verificationRequestId }, data: { status: "reviewed" } });
    return { message: action === "accept" ? `Request successfully ${action}ed` : `Request successfully ${action}d` };
  }

  async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const users = await database.user.findMany({
      skip: skip,
      take: limit,
      select: { fullName: true, email: true, type: true, role: true, phone: true, updatedAt: true, id: true },
    });

    const totalUsers = await database.user.count();

    return {
      data: users,
      total: totalUsers,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalUsers / limit),
    };
  }

  async getAllCommunities(page: number, limit: number, type: CommunityType) {
    const skip = (page - 1) * limit;
    const communities = await database.community.findMany({
      where: { type },
      skip: skip,
      take: limit,
      select: { createdAt: true, ownerId: true, name: true, subscriberCount: true, id: true },
    });

    const totalCommunities = await database.community.count({ where: { type } });

    return {
      data: communities,
      total: totalCommunities,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCommunities / limit),
    };
  }

  async getUserDetails(userId: number) {
    const userDetails = await database.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true, type: true, role: true, phone: true, updatedAt: true, id: true, recentLoginDate: true },
    });
    if (!userDetails) throw new AppError("No Account with this id exist", 404);

    const communitiesUserBelongTo = await database.communityMember.findMany({ where: { userId }, select: { role: true, community: { select: { name: true, type: true } } } });

    const allMessages = await database.message.findMany({ where: { senderId: userId }, select: { content: true, type: true }, orderBy: { createdAt: "desc" } });

    return { userDetails, communitiesUserBelongTo, allMessages };
  }

  async getCommunityDetails(communityId: number) {
    const communityDetails = await database.community.findUnique({
      where: { id: communityId, deleteFlag: false },
      include: {
        ownerDetails: { select: { profile: true, fullName: true, bio: true, email: true, phone: true } },
        members: { select: { userDetails: { select: { profile: true, phone: true } }, role: true, createdAt: true } },
      },
      omit: { deleteFlag: true },
    });

    if (!communityDetails) throw new AppError("No Community with this id exist", 404);

    const allMessages = await database.message.findMany({ where: { roomId: communityDetails.roomId }, orderBy: { createdAt: "desc" } });

    const allReports = await database.flaggedData.findMany({ where: { communityId } });

    return { communityDetails, allMessages, messagesSent: allMessages.length, allReports, totalReports: allReports.length };
  }

  async getContentManagementPageData() {
    const currentYear = getCurrentDate().split("-")[0];
    const flaggedDataTrend = await database.flaggedData.findMany({ where: { date: { startsWith: currentYear } }, select: { id: true, date: true } });
    const pendingCases = await database.flaggedData.findMany({ where: { status: "pending" } });
    const allReportedCases = await database.flaggedData.findMany({ select: { reason: true, status: true } });
    let numOfResolvedCases = 0;
    let numOfSpamCases = 0;
    let numofViolenceCases = 0;
    let numOfPornCases = 0;
    let numOfHateSpeechCases = 0;

    for (let item of allReportedCases) {
      if (item.status !== "pending") numOfResolvedCases++;

      switch (item.reason) {
        case "spam":
          numOfSpamCases++;
          break;
        case "hateSpeech":
          numOfHateSpeechCases++;
          break;
        case "pornography":
          numOfPornCases++;
          break;
        default:
          numofViolenceCases++;
          break;
      }
    }

    return {
      totalFlaggedContent: allReportedCases.length,
      numOfPendingCases: pendingCases.length,
      numOfResolvedCases,
      pendingCases,
      flaggedDataTrend,
      commonVoilationPercentages:
        allReportedCases.length === 0
          ? { spam: 0, porn: 0, hateSpeech: 0, violence: 0 }
          : {
              spam: ((numOfSpamCases / allReportedCases.length) * 100).toFixed(2),
              porn: ((numOfPornCases / allReportedCases.length) * 100).toFixed(2),
              hateSpeech: ((numOfHateSpeechCases / allReportedCases.length) * 100).toFixed(2),
              violence: ((numofViolenceCases / allReportedCases.length) * 100).toFixed(2),
            },
    };
  }

  async getAnalyticsPageData() {
    // get top performing groups
    const currentDate = getCurrentDate();
    const currentYear = currentDate.split("-")[0];
    const newUsersGrowthTrend = (await database.$queryRaw`
    SELECT \`createdAt\`, \`id\` FROM \`users\`
    WHERE EXTRACT(YEAR FROM \`createdAt\`) = ${currentYear}
    AND \`type\` = 'user'
`) as { createdAt: Date; id: number }[];
    const totalUsers = await database.user.count({ where: { type: "user" } });
    const numOfActiveUsers = await database.dailyUser.count({ where: { date: currentDate } });
    const totalMessagesSent = await database.message.count();
    const totalGroupsCreated = await database.community.count({ where: { type: "group" } });
    const totalChannelsCreated = await database.community.count({ where: { type: "channel" } });
    const deviceAndTimezoneStats = await database.dailyUser.findMany({ where: { date: { startsWith: currentYear } }, omit: { userId: true } });

    // code for getting top performing group
    const topPerformingGroups = await database.activeCommunity.findMany({
      where: { date: currentDate },
      orderBy: { numberOfEngagement: "desc" },
      include: { community: { select: { name: true, subscriberCount: true, status: true } } },
    });

    return {
      newUsersGrowthTrend,
      totalUsers,
      numOfActiveUsers,
      totalMessagesSent,
      totalGroupsCreated,
      totalChannelsCreated,
      deviceAndTimezoneStats,
      topPerformingGroups: topPerformingGroups.length <= 5 ? topPerformingGroups : topPerformingGroups.slice(0, 5),
    };
  }

  async backupDatabase() {
    try {
      const now = new Date().toISOString().replace(/[:.]/g, "-");
      const storagePath = join(__dirname, "..", "..", "..", `/storage/database_backups/${now}.sql`);
      const command = `mysqldump -u ${process.env.DATABASE_USER} -p'${process.env.DATABASE_PASSWORD}' ${process.env.DATABASE_NAME} > ${storagePath}`;
      // console.log(`Command Executed:${command}`);
      await execAsync(command);
      return now;
    } catch (error) {
      console.log((error as Error).message);
      throw new AppError("Database backup failed, contact database manager.", 500);
    }
  }
}
