"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const objects_1 = require("../../common/constants/objects");
const date_1 = require("../../common/helpers/date");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const path_1 = require("path");
const asyncCmd_1 = require("../../common/helpers/classes/asyncCmd");
const promises_1 = require("fs/promises");
const path_2 = require("../../common/helpers/path");
class DashboardService {
    async addToActiveCommunities(args) {
        try {
            const { communityId, userId, type } = args;
            const currentDate = (0, date_1.getCurrentDate)();
            await objects_1.database.dailyCommunityEngagement.create({ data: { communityId, userId, date: currentDate } });
            await objects_1.database.activeCommunity.upsert({
                where: { communityId_date: { communityId, date: currentDate } },
                create: { communityId, date: currentDate, type },
                update: { numberOfEngagement: { increment: 1 } },
            });
        }
        catch (error) {
            // console.log("User")
        }
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
        return await objects_1.database.dailyUser.findMany({ where: { date: { gte: new Date(`${year}-01-01`).toISOString(), lte: new Date(`${year}-12-31`).toISOString() } } });
    }
    async getAllPendingComunityVerfRequests() {
        return await objects_1.database.communityVerification.findMany({ where: { status: "pending" } });
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
            objects_1.appEvents.emit("community-verification-email", { action: "accepted", communityName: community.name, email: contact, reason, type: community.type });
        }
        else {
            // send apologetic email
            objects_1.appEvents.emit("community-verification-email", { action: "declined", communityName: community.name, email: contact, reason, type: community.type });
        }
        await objects_1.database.communityVerification.update({ where: { id: verificationRequestId }, data: { status: "reviewed" } });
        return { message: action === "accept" ? `Request successfully ${action}ed` : `Request successfully ${action}d` };
    }
    async getAllUsers(page, limit) {
        const skip = (page - 1) * limit;
        const users = await objects_1.database.user.findMany({
            skip: skip,
            take: limit,
            select: { fullName: true, email: true, type: true, role: true, phone: true, updatedAt: true, id: true },
        });
        const totalUsers = await objects_1.database.user.count();
        return {
            data: users,
            total: totalUsers,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalUsers / limit),
        };
    }
    async getAllCommunities(page, limit, type) {
        const skip = (page - 1) * limit;
        const communities = await objects_1.database.community.findMany({
            where: { type },
            skip: skip,
            take: limit,
            select: { createdAt: true, ownerId: true, name: true, subscriberCount: true, id: true, status: true },
        });
        const totalCommunities = await objects_1.database.community.count({ where: { type } });
        return {
            data: communities,
            total: totalCommunities,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalCommunities / limit),
        };
    }
    async getUserDetails(userId) {
        const userDetails = await objects_1.database.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true, type: true, role: true, phone: true, updatedAt: true, id: true, recentLoginDate: true },
        });
        if (!userDetails)
            throw new errorHandler_1.AppError("No Account with this id exist", 404);
        const communitiesUserBelongTo = await objects_1.database.communityMember.findMany({ where: { userId }, select: { role: true, community: { select: { name: true, type: true } } } });
        const allMessages = await objects_1.database.message.findMany({ where: { senderId: userId }, select: { content: true, type: true }, orderBy: { createdAt: "desc" } });
        return { userDetails, communitiesUserBelongTo, allMessages };
    }
    async getCommunityDetails(communityId) {
        const communityDetails = await objects_1.database.community.findUnique({
            where: { id: communityId, deleteFlag: false },
            include: {
                ownerDetails: { select: { profile: true, fullName: true, bio: true, email: true, phone: true } },
                members: { select: { userDetails: { select: { profile: true, phone: true } }, role: true, createdAt: true } },
            },
            omit: { deleteFlag: true },
        });
        if (!communityDetails)
            throw new errorHandler_1.AppError("No Community with this id exist", 404);
        const allMessages = await objects_1.database.message.findMany({ where: { roomId: communityDetails.roomId }, orderBy: { createdAt: "desc" } });
        const allReports = await objects_1.database.flaggedData.findMany({ where: { communityId } });
        return { communityDetails, allMessages, messagesSent: allMessages.length, allReports, totalReports: allReports.length };
    }
    async getContentManagementPageData() {
        const currentYear = (0, date_1.getCurrentDate)().split("-")[0];
        const flaggedDataTrend = await objects_1.database.flaggedData.findMany({ where: { date: { startsWith: currentYear } }, select: { id: true, date: true } });
        const pendingCases = await objects_1.database.flaggedData.findMany({ where: { status: "pending" } });
        const allReportedCases = await objects_1.database.flaggedData.findMany({ select: { reason: true, status: true } });
        let numOfResolvedCases = 0;
        let numOfSpamCases = 0;
        let numofViolenceCases = 0;
        let numOfPornCases = 0;
        let numOfHateSpeechCases = 0;
        for (let item of allReportedCases) {
            if (item.status !== "pending")
                numOfResolvedCases++;
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
            commonVoilationPercentages: allReportedCases.length === 0
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
        const currentDate = (0, date_1.getCurrentDate)();
        const currentYear = currentDate.split("-")[0];
        const newUsersGrowthTrend = (await objects_1.database.$queryRaw `
    SELECT \`createdAt\`, \`id\` FROM \`users\`
    WHERE EXTRACT(YEAR FROM \`createdAt\`) = ${currentYear}
    AND \`type\` = 'user'
`);
        const totalUsers = await objects_1.database.user.count({ where: { type: "user" } });
        const numOfActiveUsers = await objects_1.database.dailyUser.count({ where: { date: currentDate } });
        const totalMessagesSent = await objects_1.database.message.count();
        const totalGroupsCreated = await objects_1.database.community.count({ where: { type: "group" } });
        const totalChannelsCreated = await objects_1.database.community.count({ where: { type: "channel" } });
        const deviceAndTimezoneStats = await objects_1.database.dailyUser.findMany({
            where: { date: { gte: new Date(`${currentYear}-01-01`).toISOString(), lte: new Date(`${currentYear}-12-31`).toISOString() } },
            omit: { userId: true },
        });
        // code for getting top performing group
        const topPerformingGroups = await objects_1.database.activeCommunity.findMany({
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
            const storagePath = (0, path_1.join)(__dirname, "..", "..", "..", `/storage/database_backups/${now}.sql`);
            const command = `mysqldump -u ${process.env.DATABASE_USER} -p'${process.env.DATABASE_PASSWORD}' ${process.env.DATABASE_NAME} > ${storagePath}`;
            // console.log(`Command Executed:${command}`);
            await (0, asyncCmd_1.execAsync)(command);
            return now;
        }
        catch (error) {
            console.log(error.message);
            throw new errorHandler_1.AppError("Database backup failed, contact database manager.", 500);
        }
    }
    async restoreBackup(date) {
        // Regular expression to match the date format "2025-03-03T17-15-39-498Z"
        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;
        if (!dateFormatRegex.test(date)) {
            throw new errorHandler_1.AppError("Invalid date format. Expected format: YYYY-MM-DDTHH-MM-SS-SSSZ", 400);
        }
        const backupFilePath = (0, path_1.join)(__dirname, "..", "..", "..", `/storage/database_backups/${date}.sql`);
        if (!(await (0, path_2.checkPathExists)(backupFilePath))) {
            throw new errorHandler_1.AppError(`No backup was found for this date:${date}`, 404);
        }
        const command = `mysql -u ${process.env.DATABASE_USER} -p'${process.env.DATABASE_PASSWORD}' ${process.env.DATABASE_NAME} < ${backupFilePath}`;
        await (0, asyncCmd_1.execAsync)(command);
    }
    async getDatabaseBackupDates() {
        const backupFilesPath = (0, path_1.join)(__dirname, "..", "..", "..", `/storage/database_backups`);
        const backupFilesDates = (await (0, promises_1.readdir)(backupFilesPath)).map((backupDate) => backupDate.split(".s")[0]);
        return backupFilesDates;
    }
}
exports.DashboardService = DashboardService;
