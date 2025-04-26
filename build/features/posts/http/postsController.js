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
exports.postsRouter = void 0;
const express_1 = require("express");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const createStoryDto_1 = require("../dtos/createStoryDto");
const errorHandler_1 = require("../../../common/middlewares/errorHandler");
const objects_1 = require("../../../common/constants/objects");
exports.postsRouter = (0, express_1.Router)();
exports.postsRouter.post("/story", (0, bodyValidator_1.bodyValidator)(createStoryDto_1.CreateStoryDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, storyDto = __rest(_a, ["verifiedUserId"]);
    res.status(201).json(await objects_1.postsService.createStory(storyDto, verifiedUserId));
}));
exports.postsRouter.delete("/story/:storyId", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    let storyId;
    const { verifiedUserId } = req.body;
    try {
        storyId = +req.params.storyId;
    }
    catch (error) {
        throw new errorHandler_1.AppError("The Url parameter storyId must be an integer", 400);
    }
    // code for handling deletion
    await objects_1.postsService.deleteStory(storyId, verifiedUserId);
    res.status(204).end();
}));
