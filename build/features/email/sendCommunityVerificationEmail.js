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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCommunityVerificationEmail = void 0;
const nodeMailer_1 = require("../../common/libs/nodeMailer");
const sendCommunityVerificationEmail = async (data) => {
    const { email } = data, placeHolders = __rest(data, ["email"]);
    await (0, nodeMailer_1.sendEmail)(email, "PasChat Community Verification Request 🚀", "community-verification-email", placeHolders);
};
exports.sendCommunityVerificationEmail = sendCommunityVerificationEmail;
