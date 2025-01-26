"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const objects_1 = require("../../common/constants/objects");
const date_1 = require("../../common/helpers/date");
class DashboardService {
    async addToDailyUsers(args) {
        const { userId, platform } = args;
        const currentDate = (0, date_1.getCurrentDate)();
        await objects_1.database.dailyUser.upsert({ where: { userId_date: { userId, date: currentDate } }, create: { userId, date: currentDate, platform }, update: {} });
    }
    async addToActiveCommunities(args) {
        const { communityId } = args;
        const currentDate = (0, date_1.getCurrentDate)();
        await objects_1.database.activeCommunity.upsert({ where: { communityId_date: { communityId, date: currentDate } }, create: { communityId, date: currentDate }, update: {} });
    }
    async getNumberOfDailyData(dataType) {
        const currentDate = (0, date_1.getCurrentDate)();
        const yesterdayDate = (0, date_1.getYesterdayDate)(currentDate);
        const currentDailyData = dataType === "users" ? (await objects_1.database.dailyUser.findMany({ where: { date: currentDate } })).length : (await objects_1.database.activeCommunity.findMany({ where: { date: currentDate } })).length;
        const yesterdayDailyData = dataType === "users" ? (await objects_1.database.dailyUser.findMany({ where: { date: yesterdayDate } })).length : (await objects_1.database.activeCommunity.findMany({ where: { date: yesterdayDate } })).length;
        if (yesterdayDailyData === 0) {
            // Handle the case where yesterday's data is 0
            if (currentDailyData > 0) {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: "100%",
                    increment: true,
                };
            }
            else if (currentDailyData < 0) {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: "100%",
                    decrement: true,
                };
            }
            else {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: "0%",
                    same: true,
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
                };
            }
            else if (percentageChange < 0) {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: `${Math.abs(percentageChange).toFixed(2)}%`,
                    decrement: true,
                };
            }
            else {
                return {
                    dailyTotal: currentDailyData,
                    percentageChange: "0%",
                    same: true,
                };
            }
        }
    }
}
exports.DashboardService = DashboardService;
