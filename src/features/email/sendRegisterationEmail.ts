import { sendEmail } from "../../common/libs/nodeMailer";

export interface RegistrationOtpEmailI {
  password: string;
  email: string;
}

export const sendRegistrationEmail = async (data: RegistrationOtpEmailI) => {
  const { password ,email } = data;
  await sendEmail(email, "Welcome To FTI-Nexus", "registration-otp-email", {password});
};
