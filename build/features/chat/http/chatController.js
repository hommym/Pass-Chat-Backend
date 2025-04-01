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
exports.chatRouter = void 0;
const express_1 = require("express");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const chatRoomDto_1 = require("../dto/chatRoomDto");
const objects_1 = require("../../../common/constants/objects");
const updateMessageDto_1 = require("../dto/updateMessageDto");
const errorHandler_1 = require("../../../common/middlewares/errorHandler");
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.post("/room", (0, bodyValidator_1.bodyValidator)(chatRoomDto_1.ChatRoomDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, phoneNumbers = __rest(_a, ["verifiedUserId"]);
    const { user1Phone, user2Phone } = phoneNumbers;
    res.status(201).json(await objects_1.chatService.creatChatRoomDeatils(user1Phone, user2Phone, verifiedUserId));
}));
exports.chatRouter.get("/room", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { verifiedUserId } = req.body;
    res.status(201).json(await objects_1.chatService.getAllChatRooms(verifiedUserId));
}));
exports.chatRouter.patch("/message", (0, bodyValidator_1.bodyValidator)(updateMessageDto_1.UpdateMessageDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, messageData = __rest(_a, ["verifiedUserId"]);
    const webUser = req.params.webUser ? true : false; // for differentiating between web and mobile request
    await objects_1.chatService.updateMessage(verifiedUserId, messageData, webUser);
    res.status(204).end();
}));
exports.chatRouter.delete("/message", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { verifiedUserId, messageId } = req.body;
    const webUser = req.params.webUser ? true : false;
    if (!messageId)
        throw new errorHandler_1.AppError("No value passed for messageId", 400);
    await objects_1.chatService.deleteMessage(+messageId, verifiedUserId, webUser);
    res.status(204).end();
}));
exports.chatRouter.patch("/pin/message/:messageId", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { messageId } = req.params;
    const { verifiedUserId } = req.body;
    try {
        res.status(200).json(await objects_1.chatService.pinMessage(+messageId, verifiedUserId));
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        else
            throw new errorHandler_1.AppError("Url parameter messageId should be an integer", 400);
    }
}));
