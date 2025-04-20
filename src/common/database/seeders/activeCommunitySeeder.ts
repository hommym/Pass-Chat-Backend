import { dashboardService, database, randomData } from "../../constants/objects";
import { ConcurrentTaskExec } from "../../helpers/classes/concurrentTaskExec";

export const ActiveCommunitySeeder = async () => {
  const allUsers = await database.user.findMany({ where: { type: "user" } });
  const allCommunities = await database.community.findMany({ where: { type: "group" } });

 
//  console.log("ActiveCommunity Seeder");
  await new ConcurrentTaskExec(
    allCommunities.map(async (item) => {
      const randomNum = randomData.num(0, allUsers.length);

      for (let index: number = 0; index < randomNum; index++) {
        await dashboardService.addToActiveCommunities({ communityId: item.id, type: "group", userId: allUsers[index].id });
      }
    })
  ).executeTasks();
};
