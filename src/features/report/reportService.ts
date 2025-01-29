import { appEvents, chatNotificationService, database } from "../../common/constants/objects";
import { getCurrentDate } from "../../common/helpers/date";
import { AppError } from "../../common/middlewares/errorHandler";
import { ResolveReportDto } from "./dto/resolveReportsDto";
import { SubmitReportDto } from "./dto/submitReportDto";

export class ReportService {
  async submitReport(reportDto: SubmitReportDto) {
    const { reason, type, communityId, messageId, phone } = reportDto;
    const date = getCurrentDate();
    if (type === "message") {
      if (!messageId) throw new AppError("No data passed for messageId in body", 400);
      else if (!(await database.message.findUnique({ where: { id: messageId } }))) throw new AppError("No message with such id exist", 404);
      await database.flaggedData.create({ data: { reason, type, date, messageId } });
    } else if (type === "account") {
      if (!phone) throw new AppError("No data passed for phone in body", 400);
      const account = await database.user.findUnique({ where: { phone } });
      if (!account) throw new AppError("No Account with this phone exist", 404);
      await database.user.update({ where: { id: account.id }, data: { status: "suspend" } });
      await database.flaggedData.create({ data: { reason, type, date, userId: account.id } });
    } else {
      if (!communityId) throw new AppError("No data passed for communityId in body", 400);
      else if (!(await database.community.findUnique({ where: { id: communityId } }))) throw new AppError("No Community with this id exist", 404);
      await database.community.update({ where: { id: communityId }, data: { status: "suspend" } });
      await database.flaggedData.create({ data: { reason, type, date, communityId } });
    }
    return { message: "Report Submitted Successfully" };
  }
  async getAllReports() {
    return await database.flaggedData.findMany({ orderBy: { timeStamp: "desc" }, where: { status: { notIn: ["approved", "declined"] } } });
  }

  async resolveReport(resolveDto: ResolveReportDto) {
    const { action, flaggedDataId } = resolveDto;
    const flaggedData = await database.flaggedData.findUnique({ where: { id: flaggedDataId } });

    if (!flaggedData) throw new AppError("No flggedData with this id exist", 404);
    const { type } = flaggedData;

    await database.flaggedData.update({ where: { id: flaggedDataId }, data: { status: action } });
    if (type === "message" && action === "approved") {
      //update the message data
      // notify participants of
      const { room, recipientId, senderId, id } = await database.message.update({
        where: { id: flaggedData.messageId! },
        data: { reportFlag: true },
        select: { room: { select: { type: true, community: true } }, senderId: true, recipientId: true, id: true },
      });

      if (room.type === "private") {
        await chatNotificationService.saveNotification(id, senderId);
        await chatNotificationService.saveNotification(id, recipientId!);
      } else {
        const communityId = room.community[0].id;
        const communityMembers = await database.communityMember.findMany({ where: { communityId } });
        const membersIds = communityMembers.map((member) => member.userId);
        appEvents.emit("set-community-members-notifications", { action: "updateMessage", communityId, membersIds, messageId: flaggedData.messageId, platform: "mobile" });
      }
    } else if (type === "account" && action === "approved") {
      // ban account
      await database.user.update({ where: { id: flaggedData.userId! }, data: { status: "blocked" } });
    } else if (type === "community" && action === "approved") {
      //ban community
      await database.community.update({ where: { id: flaggedData.communityId! }, data: { status: "blocked" } });
    }
  }
}
