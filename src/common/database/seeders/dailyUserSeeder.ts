import { dashboardService, database, randomData } from "../../constants/objects";
import { getCurrentDate } from "../../helpers/date";

export const DailyUserSeeder = async () => {
  const allUsers = await database.user.findMany({ where: { type: "user" } });

  for (let user of allUsers) {
    const randNum = randomData.num(1, 3);
    const currentDate = getCurrentDate(true);
    await database.dailyUser.upsert({
      where: { userId_date: { userId: user.id, date: currentDate } },
      create: { userId: user.id, platform: randNum === 1 ? "android" : randNum === 2 ? "ios" : "desktop", timezone: randNum === 1 ? "Africa/Accra" : "Africa/Abuja" },
      update: {},
    });
  }
};
