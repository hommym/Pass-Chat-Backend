import { MessageType } from "@prisma/client";
import { database } from "../../constants/objects";

export const MessageSeeder = async () => {
  const chatRooms = await database.chatRoom.findMany({ where: { user1Id: { not: null }, user2Id: { not: null } }, select: { id: true, user1Id: true, user2Id: true } });

  if (chatRooms.length === 0) {
    console.error("No chat rooms in the database to seed messages.");
    return;
  }

  const messages = [];

  for (let i = 0; i < 10; i++) {
    const chatRoom = chatRooms[Math.floor(Math.random() * chatRooms.length)];
    const senderId = Math.random() < 0.5 ? chatRoom.user1Id : chatRoom.user2Id;
    const recipientId = senderId === chatRoom.user1Id ? chatRoom.user2Id : chatRoom.user1Id;

    messages.push({
      type: "text" as MessageType,
      content: { text: `Sample message ${i + 1}` },
      senderId: senderId!,
      recipientId,
      roomId: chatRoom.id,
    });
  }

  for (const message of messages) {
    await database.message.create({
      data: message,
    });
  }
};
