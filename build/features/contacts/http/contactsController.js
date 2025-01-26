"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactsRouter = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const savedContactsDto_1 = require("../dtos/savedContactsDto");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const objects_1 = require("../../../common/constants/objects");
exports.contactsRouter = (0, express_1.Router)();
exports.contactsRouter.post("/save", (0, bodyValidator_1.bodyValidator)(savedContactsDto_1.SavedContactsDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { contacts, verifiedUserId } = req.body;
    await objects_1.contactsService.saveContacts(contacts, verifiedUserId);
    res.status(204).end();
}));
exports.contactsRouter.get("/save", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { verifiedUserId } = req.body;
    res.status(200).json(await objects_1.contactsService.getSavedContacts(verifiedUserId));
}));
