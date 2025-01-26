"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDbConnection = void 0;
const objects_1 = require("../constants/objects");
const checkDbConnection = async () => {
    try {
        console.log("Connecting To Database..");
        await objects_1.database.user.findMany({});
        console.log("Connection Sucessfull");
    }
    catch (error) {
        console.log(error);
        throw new Error("Database Connection Error...");
    }
};
exports.checkDbConnection = checkDbConnection;
