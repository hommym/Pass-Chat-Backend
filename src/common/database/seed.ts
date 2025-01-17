import { ChatRoomSeeder } from "./seeders/chatRoomSeeder";
import { CommunitySeeder } from "./seeders/communitySeeder";
import { ContactSeeder } from "./seeders/contactSeeder";
import { MessageSeeder } from "./seeders/messageSeeder";
import { UserSeeder } from "./seeders/userSeeder";

const initialiseSeeders = async () => {
  console.log("Setting Up Seeders...");
  await UserSeeder();
  await ContactSeeder();
  await ChatRoomSeeder();
  await MessageSeeder();
  await CommunitySeeder();
  console.log("Setup Finished");
};

initialiseSeeders();
