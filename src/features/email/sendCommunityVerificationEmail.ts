import { sendEmail } from "../../common/libs/nodeMailer";

export interface CommunityVerificationEmail {
  email: string;
  communityName: string;
  action: "accepted" | "declined";
  reason: string;
}

export const sendCommunityVerificationEmail = async (data: CommunityVerificationEmail) => {
  const { email, ...placeHolders } = data;
  await sendEmail(email, "PasChat Community Verification Request 🚀", "community-verification-email", placeHolders);
};
