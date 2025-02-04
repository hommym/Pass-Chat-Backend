import { OS } from "@prisma/client";
import { appEvents, database } from "../../common/constants/objects";
import { getCurrentDate, getYesterdayDate } from "../../common/helpers/date";
import { UpdateCommunityVerificationStatus } from "./dto/updateCommunityVerficationStatusDto";
import { AppError } from "../../common/middlewares/errorHandler";

export class DashboardService {
  async addToDailyUsers(args: { userId: number; platform: OS; timezone: string }) {
    const { userId, platform, timezone } = args;
    const currentDate = getCurrentDate();
    await database.dailyUser.upsert({ where: { userId_date: { userId, date: currentDate } }, create: { userId, date: currentDate, platform, timezone }, update: {} });
  }

  async addToActiveCommunities(args: { communityId: number }) {
    const { communityId } = args;
    const currentDate = getCurrentDate();
    await database.activeCommunity.upsert({ where: { communityId_date: { communityId, date: currentDate } }, create: { communityId, date: currentDate }, update: {} });
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
    return await database.communityVerification.findMany({where:{status:"pending"}});
  }

  async updateCommunityVerificationStatus(data: UpdateCommunityVerificationStatus) {
    const { action, verificationRequestId, reason } = data;

    const verificationRequest = await database.communityVerification.findUnique({ where: { id: verificationRequestId }, include: { community: true } });

    if (!verificationRequest) throw new AppError("No Verification Request with this Id exist", 404);

    const { community, contact } = verificationRequest;
    if (action === "accept") {
      await database.community.update({ where: { id: verificationRequest.communityId }, data: { isVerified: true } });
      //send congratulation email
      appEvents.emit("community-verification-email", { action: "accepted", communityName: community.name, email: contact, reason ,type:community.type});
    } else {
      // send apologetic email
      appEvents.emit("community-verification-email", { action: "declined", communityName: community.name, email: contact, reason,type:community.type });
    }

    await database.communityVerification.update({ where: { id: verificationRequestId }, data: { status: "reviewed" } });
    return { message: action === "accept" ? `Request successfully ${action}ed` : `Request successfully ${action}d` };
  }
}
