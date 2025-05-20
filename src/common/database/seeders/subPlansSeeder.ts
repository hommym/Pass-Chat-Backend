import { subscriptionService } from "../../constants/objects";

export const SubPlansSeeders = async () => {
  await subscriptionService.createSubscription({
    name: "Basic",
    description: "Gives you the basic benefit if you are not heavy social media user",
    interval: "month",
    price: 999,
    benefit: {
      maxFilesSizePerDay: 100,
      maxFilesSizePerUpload: 10,
      maxFoldersCount: 20,
      maxMembersPerChannel: 2000000,
      maxMembersPerGroup: 1000000,
      maxMessageSchedules: 50,
      maxOwnedCommunities: 10,
      avatarProfile: false,
    },
  });
};
