"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyUserSeeder = void 0;
const objects_1 = require("../../constants/objects");
const date_1 = require("../../helpers/date");
const DailyUserSeeder = async () => {
    const allUsers = await objects_1.database.user.findMany({ where: { type: "user" } });
    for (let user of allUsers) {
        const randNum = objects_1.randomData.num(1, 3);
        const currentDate = (0, date_1.getCurrentDate)(true);
        await objects_1.database.dailyUser.upsert({
            where: { userId_date: { userId: user.id, date: currentDate } },
            create: { userId: user.id, platform: randNum === 1 ? "android" : randNum === 2 ? "ios" : "desktop", timezone: randNum === 1 ? "Africa/Accra" : "Africa/Abuja" },
            update: {},
        });
    }
};
exports.DailyUserSeeder = DailyUserSeeder;
