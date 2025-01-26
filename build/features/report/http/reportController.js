"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRouter = void 0;
const express_1 = require("express");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const submitReportDto_1 = require("../dto/submitReportDto");
const objects_1 = require("../../../common/constants/objects");
const checkAccountType_1 = require("../../../common/middlewares/checkAccountType");
const resolveReportsDto_1 = require("../dto/resolveReportsDto");
exports.reportRouter = (0, express_1.Router)();
exports.reportRouter.post("/submit", (0, bodyValidator_1.bodyValidator)(submitReportDto_1.SubmitReportDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, reportDto = __rest(_a, ["verifiedUserId"]);
    res.status(201).json(await objects_1.reportService.submitReport(reportDto));
}));
exports.reportRouter.get("/all", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.reportService.getAllReports());
}));
exports.reportRouter.patch("/resolved", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, bodyValidator_1.bodyValidator)(resolveReportsDto_1.ResolveReportDto), (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, resolveDto = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.reportService.resolveReport(resolveDto));
}));
