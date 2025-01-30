"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const objects_1 = require("../../common/constants/objects");
const date_1 = require("../../common/helpers/date");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
class DashboardService {
    async addToDailyUsers(args) {
        const { userId, platform, timezone } = args;
        const currentDate = (0, date_1.getCurrentDate)();
        await objects_1.database.dailyUser.upsert({ where: { userId_date: { userId, date: currentDate } }, create: { userId, date: currentDate, platform, timezone }, update: {} });
    }
    async addToActiveCommunities(args) {
        const { communityId } = args;
        const currentDate = (0, date_1.getCurrentDate)();
        await objects_1.database.activeCommunity.upsert({ where: { communityId_date: { communityId, date: currentDate } }, create: { communityId, date: currentDate }, update: {} });
    }
    async getNumberOfDailyData(dataType) {
        const currentDate = (0, date_1.getCurrentDate)();
        const yesterdayDate = (0, date_1.getYesterdayDate)(currentDate);
        const currentDailyData = dataType === "users"
            ? (await objects_1.database.dailyUser.findMany({ where: { date: currentDate } })).length
            : dataType === "flaggedMessage"
                ? (await objects_1.database.flaggedData.findMany({ where: { date: currentDate, type: "message" } })).length
                : dataType === "bannedAccounts"
                    ? (await objects_1.database.flaggedData.findMany({ where: { date: currentDate, type: "account" } })).length
                    : (await objects_1.database.activeCommunity.findMany({ where: { date: currentDate } })).length;
        const yesterdayDailyData = dataType === "users" ? (await objects_1.database.dailyUser.findMany({ where: { date: yesterdayDate } })).length : (await objects_1.database.activeCommunity.findMany({ where: { date: yesterdayDate } })).length;
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
            }
            else if (currentDailyData < 0) {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: "100%",
                    decrement: true,
                    same: false,
                    increment: false,
                };
            }
            else {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: "0%",
                    same: true,
                    increment: false,
                    decrement: false,
                };
            }
        }
        else {
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
            }
            else if (percentageChange < 0) {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: `${Math.abs(percentageChange).toFixed(2)}%`,
                    decrement: true,
                    same: false,
                    increment: false,
                };
            }
            else {
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
    async getUserGrowthTrend(year) {
        return await objects_1.database.dailyUser.findMany({ where: { date: { startsWith: `${year}` } } });
    }
    async getAllPendingComunityVerfRequests() {
        return await objects_1.database.communityVerification.findMany({});
    }
    async updateCommunityVerificationStatus(data) {
        const { action, verificationRequestId, reason } = data;
        const verificationRequest = await objects_1.database.communityVerification.findUnique({ where: { id: verificationRequestId }, include: { community: true } });
        if (!verificationRequest)
            throw new errorHandler_1.AppError("No Verification Request with this Id exist", 404);
        const { community, contact } = verificationRequest;
        if (action === "accept") {
            await objects_1.database.community.update({ where: { id: verificationRequest.communityId }, data: { isVerified: true } });
            //send congratulation email
            objects_1.appEvents.emit("community-verification-email", { action: "accepted", communityName: community.name, email: contact, reason });
        }
        else {
            // send apologetic email
            objects_1.appEvents.emit("community-verification-email", { action: "declined", communityName: community.name, email: contact, reason });
        }
        await objects_1.database.communityVerification.update({ where: { id: verificationRequestId }, data: { status: "reviewed" } });
        return { message: action === "accept" ? `Request successfully ${action}ed` : `Request successfully ${action}d` };
    }
}
exports.DashboardService = DashboardService;
