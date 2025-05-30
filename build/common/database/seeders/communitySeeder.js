"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunitySeeder = void 0;
const objects_1 = require("../../constants/objects");
const concurrentTaskExec_1 = require("../../helpers/classes/concurrentTaskExec");
const communities = [
    { name: "Netflix", description: "We are all about latest movies", visibility: "public" },
    { name: "4kids", description: "The best place for kids Cartoons", visibility: "private" },
    { name: "AnimeHeaven", description: "The place where all anime lives", visibility: "public" },
    { name: "TrendingNews", description: "The place for the latest news", visibility: "private" },
];
const CommunitySeeder = async () => {
    const allMobileUsers = await objects_1.database.user.findMany({ where: { type: "user" }, select: { id: true, phone: true } });
    //  console.log("Community Seeder");
    const parallelTask = new concurrentTaskExec_1.ConcurrentTaskExec(communities.map(async (community) => {
        const ownersId = allMobileUsers[objects_1.randomData.num(0, allMobileUsers.length - 1)].id;
        const savedCommunity = (await objects_1.communityService.createCommunity(objects_1.randomData.num(0, 1) === 0 ? "channel" : "group", community, ownersId)).communityDetails;
        await new concurrentTaskExec_1.ConcurrentTaskExec(allMobileUsers.map(async (user) => {
            if (user.id !== ownersId) {
                try {
                    await objects_1.communityService.joinCommunity(savedCommunity.id, user.id);
                    if (objects_1.randomData.num(0, 1) === 1) {
                        await objects_1.communityService.updateMemberRole(savedCommunity.type, ownersId, { memberPhone: user.phone, newRole: "admin", communityId: savedCommunity.id });
                    }
                }
                catch (error) {
                    //logs
                }
                // await communityService.updateCommunitySubCount({communityId:savedCommunity.id,operation:"add"})
            }
        })).executeTasks();
    }));
    await parallelTask.executeTasks();
};
exports.CommunitySeeder = CommunitySeeder;
