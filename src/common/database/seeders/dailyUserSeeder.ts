import { dashboardService, database, randomData } from "../../constants/objects";

export const DailyUserSeeder = async () => {
  const allUsers = await database.user.findMany({ where: { type: "user" } });

  for (let user of allUsers) {
    const randNum = randomData.num(1, 3);
    await dashboardService.addToDailyUsers({ platform: randNum === 1 ? "android" : randNum === 2 ? "ios" : "desktop", timezone: randNum === 1 ? "Africa/Accra" : "Africa/Abuja", userId: user.id });
  }
};
