import { AccountType, AdminRoles } from "@prisma/client";
import { database } from "../../constants/objects";
import { encryptData } from "../../libs/bcrypt";

export const UserSeeder = async () => {
  const password = await encryptData("Password");
  const users = [
    { email: "superAdmin@example.com", password, role: "superAdmin" as AdminRoles, type: "admin" as AccountType, fullName: "FirstName LastName" },
    { email: "modertor@example.com", password, role: "moderator" as AdminRoles, type: "admin" as AccountType, fullName: "FirstName LastName" },
    { email: "manager@example.com", password, role: "manager" as AdminRoles, type: "admin" as AccountType, fullName: "FirstName LastName" },
    { email: "analyst@example.com", password, role: "analyst" as AdminRoles, type: "admin" as AccountType, fullName: "FirstName LastName" },
    { email: "herbertharthur80@gmail.com", password, role: "superAdmin" as AdminRoles, type: "admin" as AccountType, fullName: "Herberth Arthur" },
  ];

  const mobileUsers = [
    { phone: "+233503747734", fullName: "Arthur Kendrick" },
    { phone: "+233403747734", fullName: "Hommy Kendrick" },
    { phone: "+233501777754", fullName: "Kwame Oppong" },
    { phone: "+233403748734", fullName: "Mabel Arhin" },
    { phone: "+233476748734", fullName: "Mavis Dugan" },
    { phone: "+233406728734", fullName: "Charles Lary" },
    { phone: "+233786748734", fullName: "Victoria Arthur" },
  ];

  for (const user of users) {
    await database.user.upsert({ where: { email: user.email }, create: user, update: {} });
  }

  for (const user of mobileUsers) {
     await database.user.upsert({ where: { phone: user.phone }, create: user, update: {} });
  }
};
