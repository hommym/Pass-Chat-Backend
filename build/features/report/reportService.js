"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const objects_1 = require("../../common/constants/objects");
const date_1 = require("../../common/helpers/date");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
class ReportService {
    async submitReport(reportDto) {
        const { reason, type, communityId, messageId, phone } = reportDto;
        const date = (0, date_1.getCurrentDate)();
        if (type === "message") {
            if (!messageId)
                throw new errorHandler_1.AppError("No data passed for messageId in body", 400);
            else if (!(await objects_1.database.message.findUnique({ where: { id: messageId } })))
                throw new errorHandler_1.AppError("No message with such id exist", 404);
            await objects_1.database.flaggedData.create({ data: { reason, type, date, messageId } });
        }
        else if (type === "account") {
            if (!phone)
                throw new errorHandler_1.AppError("No data passed for phone in body", 400);
            const account = await objects_1.database.user.findUnique({ where: { phone } });
            if (!account)
                throw new errorHandler_1.AppError("No Account with this phone exist", 404);
            await objects_1.database.user.update({ where: { id: account.id }, data: { status: "suspend" } });
            await objects_1.database.flaggedData.create({ data: { reason, type, date, userId: account.id } });
        }
        else {
            if (!communityId)
                throw new errorHandler_1.AppError("No data passed for communityId in body", 400);
            else if (!(await objects_1.database.community.findUnique({ where: { id: communityId } })))
                throw new errorHandler_1.AppError("No Community with this id exist", 404);
            await objects_1.database.community.update({ where: { id: communityId }, data: { status: "suspend" } });
            await objects_1.database.flaggedData.create({ data: { reason, type, date, communityId } });
        }
        return { message: "Report Submitted Successfully" };
    }
    async getAllReports() {
        return await objects_1.database.flaggedData.findMany({ orderBy: { timeStamp: "desc" }, where: { status: { notIn: ["approved", "declined"] } } });
    }
    async resolveReport(resolveDto) {
        const { action, flaggedDataId } = resolveDto;
        const flaggedData = await objects_1.database.flaggedData.findUnique({ where: { id: flaggedDataId } });
        if (!flaggedData)
            throw new errorHandler_1.AppError("No flggedData with this id exist", 404);
        const { type } = flaggedData;
        await objects_1.database.flaggedData.update({ where: { id: flaggedDataId }, data: { status: action } });
        if (type === "message" && action === "approved") {
            //update the message data
            // notify participants of
            const { room, recipientId, senderId, id } = await objects_1.database.message.update({
                where: { id: flaggedData.messageId },
                data: { reportFlag: true },
                select: { room: { select: { type: true, community: true } }, senderId: true, recipientId: true, id: true },
            });
            if (room.type === "private") {
                await objects_1.chatNotificationService.saveNotification(id, senderId);
                const senderInfo = (await objects_1.database.user.findUnique({ where: { id: senderId } }));
                // application sync mechanism
                if (senderInfo.webLoggedIn)
                    await objects_1.chatNotificationService.saveNotification(id, senderId, "browser");
                await objects_1.chatNotificationService.saveNotification(id, recipientId);
                const recipientInfo = (await objects_1.database.user.findUnique({ where: { id: recipientId } }));
                // application sync mechanism
                if (recipientInfo.webLoggedIn)
                    await objects_1.chatNotificationService.saveNotification(id, recipientId, "browser");
            }
            else {
                const communityId = room.community[0].id;
                const communityMembers = await objects_1.database.communityMember.findMany({ where: { communityId } });
                const membersIds = communityMembers.map((member) => member.userId);
                objects_1.appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, messageId: flaggedData.messageId, platform: "mobile" });
            }
        }
        else if (type === "account" && action === "approved") {
            // ban account
            await objects_1.database.user.update({ where: { id: flaggedData.userId }, data: { status: "blocked" } });
        }
        else if (type === "community" && action === "approved") {
            //ban community
            await objects_1.database.community.update({ where: { id: flaggedData.communityId }, data: { status: "blocked" } });
        }
    }
}
exports.ReportService = ReportService;
