import { CommunityType } from "@prisma/client";
import { sendEmail } from "../../common/libs/nodeMailer";

export interface CommunityVerificationEmail {
  email: string;
  communityName: string;
  action: "accepted" | "declined";
  reason: string;
  type:CommunityType;
}

export const sendCommunityVerificationEmail = async (data: CommunityVerificationEmail) => {
  const { email, ...placeHolders } = data;
  if (placeHolders.action === "accepted") {
    await sendEmail(email, "PasChat Community Verification Request 🚀", "community-verification-email", placeHolders);
  } else {
    await sendEmail(email, "PasChat Community Verification Request 🚀", "community-verification-email-declined", placeHolders);
  }
};
