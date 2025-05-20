import { appEvents } from "../constants/objects";
import { ActiveCommunitySeeder } from "./seeders/activeCommunitySeeder";
import { ChatRoomSeeder } from "./seeders/chatRoomSeeder";
import { CommunitySeeder } from "./seeders/communitySeeder";
import { ContactSeeder } from "./seeders/contactSeeder";
import { DailyUserSeeder } from "./seeders/dailyUserSeeder";
import { FlaggedDataSeeder } from "./seeders/flaggedDataSeeder";
import { MessageSeeder } from "./seeders/messageSeeder";
import { SubPlansSeeders } from "./seeders/subPlansSeeder";
import { UserSeeder } from "./seeders/userSeeder";

const initialiseSeeders = async () => {
  appEvents.setUpAllListners();
  console.log("Setting Up Seeders...");
  await UserSeeder();
  await ContactSeeder();
  await ChatRoomSeeder();
  await MessageSeeder();
  await CommunitySeeder();
  await FlaggedDataSeeder();
  await ActiveCommunitySeeder();
  await DailyUserSeeder();
  await SubPlansSeeders();
  console.log("Setup Finished");
};

initialiseSeeders();
