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
exports.dashboardRouter.get("/user-management/users", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { page, limit } = req.query;
        res.status(200).json(await objects_1.dashboardService.getAllUsers(page ? +page : 1, limit ? +limit : 20));
    }
    catch (error) {
        throw new errorHandler_1.AppError(error instanceof errorHandler_1.AppError ? error.message : "Query params size and limit should be of type integers", 400);
    }
}));
exports.dashboardRouter.get("/user-management/user/details/:id", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        res.status(200).json(await objects_1.dashboardService.getUserDetails(+id));
    }
    catch (error) {
        throw new errorHandler_1.AppError(error instanceof errorHandler_1.AppError ? error.message : "Url parameter id must be an integer", 400);
    }
}));
exports.dashboardRouter.get("/user-management/community/:type", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    const { type } = req.params;
    if (type === "groups" || type === "channels") {
        try {
            const { page, limit } = req.query;
            res.status(200).json(await objects_1.dashboardService.getAllCommunities(page ? +page : 1, limit ? +limit : 20, type === "groups" ? "group" : "channel"));
        }
        catch (error) {
            throw new errorHandler_1.AppError(error instanceof errorHandler_1.AppError ? error.message : "Query params size and limit should be of type integers", 400);
        }
    }
    else {
        throw new errorHandler_1.AppError("Url parameter type must have a value groups or channels", 400);
    }
}));
exports.dashboardRouter.get("/user-management/community/details/:id", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { id } = req.params;
        res.status(200).json(await objects_1.dashboardService.getCommunityDetails(+id));
    }
    catch (error) {
        throw new errorHandler_1.AppError(error instanceof errorHandler_1.AppError ? error.message : "Url parameter id must be an integer", 400);
    }
}));
exports.dashboardRouter.get("/content-management", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getContentManagementPageData());
}));
