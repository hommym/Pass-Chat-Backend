"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = void 0;
const chatWsRequetDto_1 = require("../dto/chatWsRequetDto");
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const messageDto_1 = require("../dto/messageDto");
const objects_1 = require("../../../common/constants/objects");
const checkStatusDto_1 = require("../dto/checkStatusDto");
const setStatusDto_1 = require("../dto/setStatusDto");
const getMessagesDto_1 = require("../dto/getMessagesDto");
const callController_1 = require("../../calls/ws/callController");
const callWsRequestDto_1 = require("../../calls/dto/callWsRequestDto");
const getAllMesaagesDto_1 = require("../dto/getAllMesaagesDto");
const chatController = async (socket, request) => {
    // validate request
    await (0, bodyValidator_1.bodyValidatorWs)(chatWsRequetDto_1.ChatWsRequestDto, request);
    const { action, data } = request;
    switch (action) {
        case "sendMessage":
            await (0, bodyValidator_1.bodyValidatorWs)(messageDto_1.MessageDto, data);
            await objects_1.chatService.sendMessage(socket, data);
            break;
        case "checkStatus":
            await (0, bodyValidator_1.bodyValidatorWs)(checkStatusDto_1.CheckStatusDto, data);
            await objects_1.chatService.getUserStatus(socket, data);
            break;
        case "setStatus":
            await (0, bodyValidator_1.bodyValidatorWs)(setStatusDto_1.SetStatusDto, data);
            await objects_1.chatService.setUserStatus(socket, data);
            break;
        case "call":
            await (0, bodyValidator_1.bodyValidatorWs)(callWsRequestDto_1.CallWsRequestDto, data);
            await (0, callController_1.callController)(socket, data);
            break;
        case "getAllMessages":
            await (0, bodyValidator_1.bodyValidatorWs)(getAllMesaagesDto_1.GetAllMessagesDto, data);
            await objects_1.chatService.getMessages(socket, data, true);
            break;
        case "getStory":
            await objects_1.postsService.getStories(socket);
            break;
        default:
            await (0, bodyValidator_1.bodyValidatorWs)(getMessagesDto_1.GetMessagesDto, data);
            await objects_1.chatService.getMessages(socket, data);
            break;
    }
};
exports.chatController = chatController;
