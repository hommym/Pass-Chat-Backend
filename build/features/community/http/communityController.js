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
exports.communityRouter = void 0;
const express_1 = require("express");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("../../../common/middlewares/errorHandler");
const objects_1 = require("../../../common/constants/objects");
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const createCommunityDto_1 = require("../dto/createCommunityDto");
const permissionsDto_1 = require("../dto/permissionsDto");
const updateRoleDto_1 = require("../dto/updateRoleDto");
const verifyCommunityDto_1 = require("../dto/verifyCommunityDto");
const addMembersDto_1 = require("../dto/addMembersDto");
exports.communityRouter = (0, express_1.Router)();
exports.communityRouter.post("/add-members", (0, bodyValidator_1.bodyValidator)(addMembersDto_1.AddMembersDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, addMembersDto = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.communityService.addMembersToCommunity(addMembersDto, verifiedUserId));
}));
exports.communityRouter.post("/:type", (0, bodyValidator_1.bodyValidator)(createCommunityDto_1.CreateCommunityDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { type } = req.params;
    const _a = req.body, { verifiedUserId } = _a, creatCommunityDto = __rest(_a, ["verifiedUserId"]);
    if (!(type === "channel" || type === "group"))
        throw new errorHandler_1.AppError("Valid values for type params should be channel or group", 400);
    res.status(201).json(await objects_1.communityService.createCommunity(type, creatCommunityDto, verifiedUserId));
}));
exports.communityRouter.post("/:communityId/join", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    let communityId;
    const { verifiedUserId } = req.body;
    try {
        communityId = +req.params.communityId;
    }
    catch (error) {
        throw new errorHandler_1.AppError("Url parameter communityId must be an integer", 400);
    }
    res.status(201).json(await objects_1.communityService.joinCommunity(+communityId, verifiedUserId));
}));
exports.communityRouter.delete("/:communityId/exit", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    let communityId;
    const { verifiedUserId } = req.body;
    try {
        communityId = +req.params.communityId;
    }
    catch (error) {
        throw new errorHandler_1.AppError("Url parameter communityId must be an integer", 400);
    }
    await objects_1.communityService.exitCommunity(+communityId, verifiedUserId);
    res.status(204).end();
}));
exports.communityRouter.delete("/", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { verifiedUserId, communityId } = req.body;
    await objects_1.communityService.deleteCommunity(communityId, verifiedUserId);
    res.status(204).end();
}));
exports.communityRouter.patch("/:type/role", (0, bodyValidator_1.bodyValidator)(updateRoleDto_1.UpdateRoleDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { type } = req.params;
    if (!(type === "channel" || type === "group"))
        throw new errorHandler_1.AppError("Valid values for type url parameter should be channel or group", 400);
    const _a = req.body, { verifiedUserId } = _a, updateRoleDto = __rest(_a, ["verifiedUserId"]);
    await objects_1.communityService.updateMemberRole(type, verifiedUserId, updateRoleDto);
    res.status(204).end();
}));
exports.communityRouter.patch("/group/permissions", (0, bodyValidator_1.bodyValidator)(permissionsDto_1.GroupPermissionsDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, updatePermissionsDto = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.communityService.updatePermissions(verifiedUserId, updatePermissionsDto, "group"));
}));
exports.communityRouter.patch("/channel/permissions", (0, bodyValidator_1.bodyValidator)(permissionsDto_1.ChannelPermissionDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, updatePermissionsDto = __rest(_a, ["verifiedUserId"]);
    await objects_1.communityService.updatePermissions(verifiedUserId, updatePermissionsDto, "channel");
    res.status(204).end();
}));
exports.communityRouter.get("/all/user", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { verifiedUserId } = req.body;
    res.status(200).json(await objects_1.communityService.getAllUsersCommunities(verifiedUserId));
}));
exports.communityRouter.get("/details", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { verifiedUserId, communityId } = req.body;
    if (!communityId)
        throw new errorHandler_1.AppError("No data passed for communityId in body", 400);
    res.status(200).json(await objects_1.communityService.getCommunityDetailsForUser(verifiedUserId, communityId));
}));
exports.communityRouter.get("/search", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    // const { verifiedUserId } = req.body;
    const { keyword } = req.query;
    if (!keyword)
        throw new errorHandler_1.AppError("No Value passed for group or channel name", 400);
    res.status(200).json(await objects_1.communityService.search(keyword));
}));
exports.communityRouter.post("/apply/verification", (0, bodyValidator_1.bodyValidator)(verifyCommunityDto_1.VerifyCommunityDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, dataForVerification = __rest(_a, ["verifiedUserId"]);
    res.status(201).json(await objects_1.communityService.verifyCommunity(verifiedUserId, dataForVerification));
}));
