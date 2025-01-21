import { CommunityVisibility } from "@prisma/client";
import { communityService, database, randomData } from "../../constants/objects";

const communities = [
  { name: "Netflix", description: "We are all about latest movies", visibility: "public" as CommunityVisibility },
  { name: "4kids", description: "The best place for kids Cartoons", visibility: "private" as CommunityVisibility },
  { name: "AnimeHeaven", description: "The place where all anime lives", visibility: "public" as CommunityVisibility },
  { name: "TrendingNews", description: "The place for the latest news", visibility: "private" as CommunityVisibility },
];

export const CommunitySeeder = async () => {
  const allMobileUsers = await database.user.findMany({ where: { type: "user" }, select: { id: true } });

  await Promise.all(
    communities.map(async (community) => {
      const ownersId = allMobileUsers[randomData.num(0, allMobileUsers.length - 1)].id;
      const savedCommunity = (await communityService.createCommunity(randomData.num(0, 1) === 0 ? "channel" : "group", community, ownersId)).communityDetails;
      await Promise.all(
        allMobileUsers.map(async (user) => {
          if (user.id !== ownersId) {
            await communityService.joinCommunity(savedCommunity.id, user.id);
            await communityService.updateCommunitySubCount({communityId:savedCommunity.id,operation:"add"})
          }
        })
      );
    })
  );
};
