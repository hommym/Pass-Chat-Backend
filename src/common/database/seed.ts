import { appEvents } from "../constants/objects";
import { ChatRoomSeeder } from "./seeders/chatRoomSeeder";
import { CommunitySeeder } from "./seeders/communitySeeder";
import { ContactSeeder } from "./seeders/contactSeeder";
import { FlaggedDataSeeder } from "./seeders/flaggedDataSeeder";
import { MessageSeeder } from "./seeders/messageSeeder";
import { UserSeeder } from "./seeders/userSeeder";

const initialiseSeeders = async () => {
  appEvents.setUpAllListners()
  console.log("Setting Up Seeders...");
  await UserSeeder();
  await ContactSeeder();
  await ChatRoomSeeder();
  await MessageSeeder();
  await CommunitySeeder();
  await FlaggedDataSeeder();
  console.log("Setup Finished");
};

initialiseSeeders();
