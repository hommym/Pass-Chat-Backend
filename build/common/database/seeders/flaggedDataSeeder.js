"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlaggedDataSeeder = void 0;
const client_1 = require("@prisma/client");
const date_1 = require("../../helpers/date");
const objects_1 = require("../../constants/objects");
const getRandomEnumValue = (enumObj) => {
    const values = Object.values(enumObj);
    return values[Math.floor(Math.random() * values.length)];
};
const FlaggedDataSeeder = async () => {
    const users = await objects_1.database.user.findMany({
        select: { id: true },
    });
    const messages = await objects_1.database.message.findMany({
        select: { id: true },
    });
    const communities = await objects_1.database.community.findMany({
        select: { id: true },
    });
    if (users.length === 0 || messages.length === 0 || communities.length === 0) {
        console.error("Not enough users, messages, or communities in the database to seed flagged data.");
        return;
    }
    const flaggedData = [];
    for (let i = 0; i < 10; i++) {
        const type = getRandomEnumValue(client_1.flaggedContent);
        const flagger = getRandomEnumValue(client_1.flaggedBy);
        const reason = getRandomEnumValue(client_1.flagReason);
        const status = getRandomEnumValue(client_1.flagStatus);
        let messageId = null;
        let userId = null;
        let communityId = null;
        if (type === client_1.flaggedContent.message) {
            messageId = messages[Math.floor(Math.random() * messages.length)].id;
        }
        else if (type === client_1.flaggedContent.account) {
            userId = users[Math.floor(Math.random() * users.length)].id;
        }
        else if (type === client_1.flaggedContent.community) {
            communityId = communities[Math.floor(Math.random() * communities.length)].id;
        }
        flaggedData.push({
            type: type,
            flagger: flagger,
            reason: reason,
            status: status,
            messageId,
            userId,
            communityId,
            date: (0, date_1.getCurrentDate)(),
        });
    }
    for (const data of flaggedData) {
        await objects_1.database.flaggedData.create({
            data,
        });
    }
};
exports.FlaggedDataSeeder = FlaggedDataSeeder;
