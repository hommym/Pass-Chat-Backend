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
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get("/daily-users", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getNumberOfDailyData("users"));
}));
exports.dashboardRouter.get("/active-communities", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.dashboardService.getNumberOfDailyData("activeCommunities"));
}));
