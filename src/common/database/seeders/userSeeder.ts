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
    { phone: "+233553747734", fullName: "Hommy Kendrick" },
    { phone: "+233501777754", fullName: "Kwame Oppong" },
    { phone: "+233403748734", fullName: "Mabel Arhin" },
    { phone: "+233207674873", fullName: "Mavis Dugan" },
    { phone: "+233550672873", fullName: "Charles Lary" },
    { phone: "+233205748569", fullName: "Victoria Arthur" },
    { phone: "+233550663440", fullName: "Herberth Arthur" },
    { phone: "+251929241160", fullName: "Joseph Arthur" },
    { phone: "+233260812576", fullName: "Michael Owusu" },
    { phone: "+233509860303", fullName: "Sandra Boateng" },
    { phone: "+233558794823", fullName: "Kwame Asante" },
    { phone: "+233544959477", fullName: "Grace Amankwa" },
    { phone: "+233555423936", fullName: "Daniel Mensah" },
    { phone: "+233558398387", fullName: "Akosua Appiah" },
    { phone: "+233545871109", fullName: "John Ofori" },
    { phone: "+233543635743", fullName: "Patricia Nyarko" },
    { phone: "+233550420120", fullName: "Emmanuel Owusu" },
  ];

  for (const user of users) {
    await database.user.upsert({ where: { email: user.email }, create: user, update: {} });
  }

  for (const user of mobileUsers) {
    await database.user.upsert({ where: { phone: user.phone }, create: user, update: {} });
  }
};
