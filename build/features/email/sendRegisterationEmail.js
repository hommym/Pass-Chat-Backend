"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRegistrationEmail = void 0;
const nodeMailer_1 = require("../../common/libs/nodeMailer");
const sendRegistrationEmail = async (data) => {
    const { password, email } = data;
    await (0, nodeMailer_1.sendEmail)(email, "Welcome To FTI-Nexus", "registration-otp-email", { password });
};
exports.sendRegistrationEmail = sendRegistrationEmail;
