import { ChatRoomSeeder } from "./seeders/chatRoomSeeder";
import { ContactSeeder } from "./seeders/contactSeeder";
import { MessageSeeder } from "./seeders/messageSeeder";
import { UserSeeder } from "./seeders/userSeeder";




const initialiseSeeders = async () => {
  console.log("Setting Up Seeders...");
  await UserSeeder();
  await ContactSeeder();
  await ChatRoomSeeder();
  await MessageSeeder();
  console.log("Setup Finished");
};

initialiseSeeders()
