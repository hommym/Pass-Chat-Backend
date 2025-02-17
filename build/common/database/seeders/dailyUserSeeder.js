"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyUserSeeder = void 0;
const objects_1 = require("../../constants/objects");
const DailyUserSeeder = async () => {
    const allUsers = await objects_1.database.user.findMany({ where: { type: "user" } });
    for (let user of allUsers) {
        const randNum = objects_1.randomData.num(1, 3);
        await objects_1.dashboardService.addToDailyUsers({ platform: randNum === 1 ? "android" : randNum === 2 ? "ios" : "desktop", timezone: randNum === 1 ? "Africa/Accra" : "Africa/Abuja", userId: user.id });
    }
};
exports.DailyUserSeeder = DailyUserSeeder;
