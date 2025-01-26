"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoomSeeder = void 0;
const objects_1 = require("../../constants/objects");
const ChatRoomSeeder = async () => {
    const allMobileUsers = await objects_1.database.user.findMany({ where: { phone: { not: null } } });
    allMobileUsers.forEach(async (user) => {
        const contacts = await objects_1.contactsService.getSavedContacts(user.id);
        contacts.forEach(async (contact) => {
            await objects_1.chatService.creatChatRoomDeatils(contact.phone, user.phone);
        });
    });
};
exports.ChatRoomSeeder = ChatRoomSeeder;
