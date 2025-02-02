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
exports.authRouter = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const userLoginDto_1 = require("../dtos/userLoginDto");
const objects_1 = require("../../../common/constants/objects");
const adminLoginDto_1 = require("../dtos/adminLoginDto");
const verify2FAOtpDto_1 = require("../dtos/verify2FAOtpDto");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const setUp2FADto_1 = require("../dtos/setUp2FADto");
const updateUserAccountDto_1 = require("../dtos/updateUserAccountDto");
const updateAdminAccountDto_1 = require("../dtos/updateAdminAccountDto");
const changePasswordDto_1 = require("../dtos/changePasswordDto");
const createAdminDto_1 = require("../dtos/createAdminDto");
const errorHandler_1 = require("../../../common/middlewares/errorHandler");
const changePhoneDto_1 = require("../dtos/changePhoneDto");
exports.authRouter = (0, express_1.Router)();
// All Auth Endpoints
exports.authRouter.post("/admin/create-account", (0, bodyValidator_1.bodyValidator)(createAdminDto_1.CreateAdminDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, accountDetails = __rest(_a, ["verifiedUserId"]);
    res.status(201).json(await objects_1.authService.createAdminAccount(accountDetails, verifiedUserId));
}));
exports.authRouter.post("/user/login", (0, bodyValidator_1.bodyValidator)(userLoginDto_1.UserLoginDto), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(201).json(await objects_1.authService.login("user", req.body));
}));
exports.authRouter.post("/user/web/login", (0, bodyValidator_1.bodyValidator)(userLoginDto_1.UserLoginDto), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(201).json(await objects_1.authService.webLogin(req.body));
}));
exports.authRouter.post("/user/web/qr-code/login", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { webClientId, verifiedUserId } = req.body;
    if (!webClientId)
        throw new errorHandler_1.AppError("No Values Passed for webClientId", 400);
    res.status(200).json(await objects_1.authService.webQrCodeLogin(webClientId, verifiedUserId));
}));
exports.authRouter.post("/user/logout", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    res.status(201).json(await objects_1.authService.logout(req.body.verifiedUserId));
}));
exports.authRouter.post("/admin/login", (0, bodyValidator_1.bodyValidator)(adminLoginDto_1.AdminLoginDto), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(201).json(await objects_1.authService.login("admin", req.body));
}));
exports.authRouter.post("/admin/send/otp/:email", (0, express_async_handler_1.default)(async (req, res) => {
    res.status(201).json(await objects_1.authService.send2FAOtp(req.params.email));
}));
exports.authRouter.post("/admin/verify/otp", (0, bodyValidator_1.bodyValidator)(verify2FAOtpDto_1.Verify2FAOtpDto), (0, express_async_handler_1.default)(async (req, res) => {
    const { email, otpCode } = req.body;
    res.status(201).json(await objects_1.authService.verify2FAOtp(otpCode, email));
}));
exports.authRouter.post("/admin/setup/2FA", (0, bodyValidator_1.bodyValidator)(setUp2FADto_1.Setup2FADto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { action, verifiedUserId } = req.body;
    res.status(201).json(await objects_1.authService.activateOrDeactivate2FA(action, verifiedUserId));
}));
exports.authRouter.patch("/user/account", (0, bodyValidator_1.bodyValidator)(updateUserAccountDto_1.UpdateUserAccountDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, updatedData = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.authService.updateAccount("user", updatedData, verifiedUserId));
}));
exports.authRouter.patch("/user/change-phone", (0, bodyValidator_1.bodyValidator)(changePhoneDto_1.ChangePhoneDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, changePhoneDto = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.authService.changePhoneNumber(verifiedUserId, changePhoneDto));
}));
exports.authRouter.patch("/admin/account", (0, bodyValidator_1.bodyValidator)(updateAdminAccountDto_1.UpdateAdminAccountDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, updatedData = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.authService.updateAccount("admin", updatedData, verifiedUserId));
}));
exports.authRouter.patch("/admin/change-password", (0, bodyValidator_1.bodyValidator)(changePasswordDto_1.ChangePasswordDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, updatedData = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.authService.changePassword(updatedData, verifiedUserId));
}));
