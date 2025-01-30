"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const objects_1 = require("../../../common/constants/objects");
const checkAccountType_1 = require("../../../common/middlewares/checkAccountType");
const errorHandler_1 = require("../../../common/middlewares/errorHandler");
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const updateCommunityVerficationStatusDto_1 = require("../dto/updateCommunityVerficationStatusDto");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get("/daily/users", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getNumberOfDailyData("users"));
}));
exports.dashboardRouter.get("/daily/active-communities", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getNumberOfDailyData("activeCommunities"));
}));
exports.dashboardRouter.get("/daily/flagged-messages", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getNumberOfDailyData("flaggedMessage"));
}));
exports.dashboardRouter.get("/daily/banned-accounts", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getNumberOfDailyData("bannedAccounts"));
}));
exports.dashboardRouter.get("/user-growth-trend/:year", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { year } = req.params;
        res.status(200).json(await objects_1.dashboardService.getUserGrowthTrend(+year));
    }
    catch (error) {
        throw new errorHandler_1.AppError("Url parameter year must be a valid year", 400);
    }
}));
exports.dashboardRouter.get("/community-verfication/applications", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getAllPendingComunityVerfRequests());
}));
exports.dashboardRouter.patch("/community-verfication/application/review", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, bodyValidator_1.bodyValidator)(updateCommunityVerficationStatusDto_1.UpdateCommunityVerificationStatus), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.updateCommunityVerificationStatus(req.body));
}));
