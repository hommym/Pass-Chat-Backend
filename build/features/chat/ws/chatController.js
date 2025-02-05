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
    if (action === "sendMessage") {
        await (0, bodyValidator_1.bodyValidatorWs)(messageDto_1.MessageDto, data);
        await objects_1.chatService.sendMessage(socket, data);
    }
    else if (action === "checkStatus") {
        await (0, bodyValidator_1.bodyValidatorWs)(checkStatusDto_1.CheckStatusDto, data);
        await objects_1.chatService.getUserStatus(socket, data);
    }
    else if (action === "setStatus") {
        await (0, bodyValidator_1.bodyValidatorWs)(setStatusDto_1.SetStatusDto, data);
        await objects_1.chatService.setUserStatus(socket, data);
    }
    else if (action === "call") {
        await (0, bodyValidator_1.bodyValidatorWs)(callWsRequestDto_1.CallWsRequestDto, data);
        await (0, callController_1.callController)(socket, data);
    }
    else if (action === "getAllMessages") {
        await (0, bodyValidator_1.bodyValidatorWs)(getAllMesaagesDto_1.GetAllMessagesDto, data);
        await objects_1.chatService.getMessages(socket, data, true);
    }
    else {
        await (0, bodyValidator_1.bodyValidatorWs)(getMessagesDto_1.GetMessagesDto, data);
        await objects_1.chatService.getMessages(socket, data);
    }
};
exports.chatController = chatController;
