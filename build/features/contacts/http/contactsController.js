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
exports.contactsRouter = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const savedContactsDto_1 = require("../dtos/savedContactsDto");
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const objects_1 = require("../../../common/constants/objects");
const blockContactDto_1 = require("../dtos/blockContactDto");
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
exports.contactsRouter.patch("/block", (0, bodyValidator_1.bodyValidator)(blockContactDto_1.BlockContactDto), verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const _a = req.body, { verifiedUserId } = _a, blockContactDto = __rest(_a, ["verifiedUserId"]);
    res.status(200).json(await objects_1.contactsService.blockContact(verifiedUserId, blockContactDto));
}));
