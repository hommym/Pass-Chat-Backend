"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = require("path");
const compileHtml_1 = require("../../features/email/compileHtml");
const path = (0, path_1.join)(__dirname, "..", "..", "/features/email/templates");
const transporter = nodemailer_1.default.createTransport({
    host: "mail.paschat.net",
    port: 465,
    secure: true,
    auth: {
        user: process.env.SmtpUserName,
        pass: process.env.SmtpSecret,
    },
});
const sendEmail = async (emailAddress, subject, template, context) => {
    // set companyName
    context.companyName = process.env.AppName;
    const html = await (0, compileHtml_1.compiledHtml)(template, context);
    const mailObject = { from: process.env.AdminEmailAdress, to: emailAddress, subject, html };
    await transporter.sendMail(mailObject);
};
exports.sendEmail = sendEmail;
