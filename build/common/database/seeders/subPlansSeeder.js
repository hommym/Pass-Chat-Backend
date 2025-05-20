"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubPlansSeeders = void 0;
const objects_1 = require("../../constants/objects");
const SubPlansSeeders = async () => {
    await objects_1.subscriptionService.createSubscription({
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
exports.SubPlansSeeders = SubPlansSeeders;
