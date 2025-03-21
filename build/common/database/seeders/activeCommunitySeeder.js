"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveCommunitySeeder = void 0;
const objects_1 = require("../../constants/objects");
const ActiveCommunitySeeder = async () => {
    const allUsers = await objects_1.database.user.findMany({ where: { type: "user" } });
    const allCommunities = await objects_1.database.community.findMany({ where: { type: "group" } });
    await Promise.all(allCommunities.map(async (item) => {
        const randomNum = objects_1.randomData.num(0, allUsers.length);
        for (let index = 0; index < randomNum; index++) {
            await objects_1.dashboardService.addToActiveCommunities({ communityId: item.id, type: "group", userId: allUsers[index].id });
        }
    }));
};
exports.ActiveCommunitySeeder = ActiveCommunitySeeder;
