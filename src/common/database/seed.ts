import { UserSeeder } from "./seeders/userSeeder";




const initialiseSeeders = async () => {
  console.log("Setting Up Seeders...");
  await UserSeeder();
  console.log("Setup Finished");
};

initialiseSeeders()
