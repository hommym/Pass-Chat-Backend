import dotenv from "dotenv";
dotenv.config();
import nodeMailer from "nodemailer";
import { join } from "path";
import { compiledHtml } from "../../features/email/compileHtml";

const path = join(__dirname, "..", "..", "/features/email/templates");
const transporter = nodeMailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SmtpUserName,
    pass: process.env.SmtpSecret,
  },
});

export const sendEmail = async (emailAddress: string, subject: string, template: string, context: any) => {
  // set companyName
  context.companyName = process.env.AppName;
  const html = await compiledHtml(template, context);
  const mailObject = { from: process.env.AdminEmailAdress, to: emailAddress, subject, html };
  await transporter.sendMail(mailObject);
};
