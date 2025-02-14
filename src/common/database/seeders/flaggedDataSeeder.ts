import { flaggedContent, flaggedBy, flagReason, flagStatus } from "@prisma/client";
import { getCurrentDate } from "../../helpers/date";
import { database } from "../../constants/objects";

const getRandomEnumValue = (enumObj: any) => {
  const values = Object.values(enumObj);
  return values[Math.floor(Math.random() * values.length)];
};

export const FlaggedDataSeeder = async () => {
  const users = await database.user.findMany({
    select: { id: true },
  });

  const messages = await database.message.findMany({
    select: { id: true },
  });

  const communities = await database.community.findMany({
    select: { id: true },
  });

  if (users.length === 0 || messages.length === 0 || communities.length === 0) {
    console.error("Not enough users, messages, or communities in the database to seed flagged data.");
    return;
  }

  const flaggedData = [];

  for (let i = 0; i < 10; i++) {
    const type = getRandomEnumValue(flaggedContent);
    const flagger = getRandomEnumValue(flaggedBy);
    const reason = getRandomEnumValue(flagReason);
    const status = getRandomEnumValue(flagStatus);

    let messageId = null;
    let userId = null;
    let communityId = null;

    if (type === flaggedContent.message) {
      messageId = messages[Math.floor(Math.random() * messages.length)].id;
    } else if (type === flaggedContent.account) {
      userId = users[Math.floor(Math.random() * users.length)].id;
    } else if (type === flaggedContent.community) {
      communityId = communities[Math.floor(Math.random() * communities.length)].id;
    }

    flaggedData.push({
      type: type as flaggedContent,
      flagger: flagger as flaggedBy,
      reason: reason as flagReason,
      status: status as flagStatus,
      messageId,
      userId,
      communityId,
      date: getCurrentDate(),
    });
  }

  for (const data of flaggedData) {
    await database.flaggedData.create({
      data,
    });
  }
};
