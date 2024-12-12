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

  for (const user of users) {
    await database.user.upsert({ where: { email: user.email }, create: user, update: {} });
  }
};
