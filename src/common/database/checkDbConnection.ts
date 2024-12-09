import { database } from "../constants/objects";

export const checkDbConnection = async () => {
  try {
    console.log("Connecting To Database..");
    await database.user.findMany({});
    console.log("Connection Sucessfull");
  } catch (error) {
    console.log(error);
    throw new Error("Database Connection Error...");
  }
};
