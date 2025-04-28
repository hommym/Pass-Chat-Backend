import { CommunityVisibility } from "@prisma/client";
import { communityService, database, randomData } from "../../constants/objects";
import { ConcurrentTaskExec } from "../../helpers/classes/concurrentTaskExec";

const communities = [
  { name: "Netflix", description: "We are all about latest movies", visibility: "public" as CommunityVisibility },
  { name: "4kids", description: "The best place for kids Cartoons", visibility: "private" as CommunityVisibility },
  { name: "AnimeHeaven", description: "The place where all anime lives", visibility: "public" as CommunityVisibility },
  { name: "TrendingNews", description: "The place for the latest news", visibility: "private" as CommunityVisibility },
];

export const CommunitySeeder = async () => {
  const allMobileUsers = await database.user.findMany({ where: { type: "user" }, select: { id: true, phone: true } });

  //  console.log("Community Seeder");
  const parallelTask = new ConcurrentTaskExec(
    communities.map(async (community) => {
      const ownersId = allMobileUsers[randomData.num(0, allMobileUsers.length - 1)].id;
      const savedCommunity = (await communityService.createCommunity(randomData.num(0, 1) === 0 ? "channel" : "group", community, ownersId)).communityDetails;
      await new ConcurrentTaskExec(
        allMobileUsers.map(async (user) => {
          if (user.id !== ownersId) {
            try {
              await communityService.joinCommunity(savedCommunity.id, user.id);
              if (randomData.num(0, 1) === 1) {
                await communityService.updateMemberRole(savedCommunity.type, ownersId, { memberPhone: user.phone!, newRole: "admin", communityId: savedCommunity.id });
              }
            } catch (error) {
              //logs
            }
            // await communityService.updateCommunitySubCount({communityId:savedCommunity.id,operation:"add"})
          }
        })
      ).executeTasks();
    })
  );

  await parallelTask.executeTasks();
};
