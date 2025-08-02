"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileHandler = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("./errorHandler");
const path_1 = require("path");
const path_2 = require("../helpers/path");
const list_1 = require("../constants/list");
const objects_1 = require("../constants/objects");
const date_1 = require("../helpers/date");
const getQoutaData = async (userId) => {
    const quotaData = await objects_1.database.dailyUploadQuota.findUnique({ where: { userId } });
    const cDate = (0, date_1.getCurrentDate)(); // current date in form yyyy-mm-dd
    if (!quotaData) {
        return await objects_1.database.dailyUploadQuota.create({ data: { userId, day: cDate } });
    }
    else if (quotaData.day !== cDate) {
        quotaData.quotaUsed = 0;
        await objects_1.database.dailyUploadQuota.update({ where: { userId }, data: { day: cDate, quotaUsed: 0 } });
    }
    return quotaData;
};
const checkDailyUploadLimit = async (uploadSize, userId, dailySizeLimit) => {
    const uploadQuotaData = await getQoutaData(userId);
    const quotaUsed = uploadSize + uploadQuotaData.quotaUsed;
    const isLimitUp = quotaUsed > dailySizeLimit;
    if (!isLimitUp)
        objects_1.appEvents.emit("update-daily-upload-quota", { userId, updatedSize: quotaUsed });
    return isLimitUp;
};
exports.fileHandler = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { buffer, mimetype, size } = req.file;
    const { mediaType, fileName, date } = req.body;
    const userSub = await objects_1.database.userSubscription.findMany({ where: { userId: req.body.verifiedUserId, status: "paid" }, include: { subPlan: true } });
    const sizeInGb = size / 1073741824;
    // check file size limit per upload and per day
    const fileLimitsData = userSub.length !== 0 ? userSub[0].subPlan.benefit : { maxFilesSizePerDay: 20, maxFilesSizePerUpload: 2 }; // sizes in gb
    //checking if file size exceed the allowed limit per upload .
    if (fileLimitsData.maxFilesSizePerUpload < sizeInGb)
        throw new errorHandler_1.AppError(`File size exceeds the allowed limit of ${fileLimitsData.maxFilesSizePerUpload}GB`, 413);
    else if (await checkDailyUploadLimit(sizeInGb, req.body.verifiedUserId, fileLimitsData.maxFilesSizePerDay))
        throw new errorHandler_1.AppError(`File size exceeds the allowed limit of ${fileLimitsData.maxFilesSizePerDay}GB per day`, 413);
    // check if the daily file size quota is reached(N/A)
    let dirPath = (0, path_1.join)(__dirname, "..", "..", "..", "/storage");
    dirPath = (0, path_1.join)(dirPath, `/${mediaType}s/${date}/${fileName.split(".")[0]}`);
    if (!(list_1.allowedMediaMimeTypes.includes(mimetype) || list_1.allowedDocumentMimeTypes.includes(mimetype))) {
        throw new errorHandler_1.AppError(`The file type ${mimetype} is supported`, 400);
    }
    else if (await (0, path_2.checkPathExists)(dirPath)) {
        throw new errorHandler_1.AppError("File already exist", 409);
    }
    objects_1.appEvents.emit("save-file", { dirPath, file: buffer, extention: fileName.split(".")[1], mediaType, date, thumpNailFileName: fileName.split(".")[0] });
    next();
});
