"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSeeder = void 0;
const objects_1 = require("../../constants/objects");
const MessageSeeder = async () => {
    const chatRooms = await objects_1.database.chatRoom.findMany({ where: { user1Id: { not: null }, user2Id: { not: null } }, select: { id: true, user1Id: true, user2Id: true } });
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
            type: "text",
            content: { text: `Sample message ${i + 1}` },
            senderId: senderId,
            recipientId,
            roomId: chatRoom.id,
        });
    }
    for (const message of messages) {
        await objects_1.database.message.create({
            data: message,
        });
    }
};
exports.MessageSeeder = MessageSeeder;
