"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoomSeeder = void 0;
const objects_1 = require("../../constants/objects");
const concurrentTaskExec_1 = require("../../helpers/classes/concurrentTaskExec");
const ChatRoomSeeder = async () => {
    const allMobileUsers = await objects_1.database.user.findMany({ where: { phone: { not: null }, type: "user" } });
    for (let user of allMobileUsers) {
        const contacts = await objects_1.contactsService.getSavedContacts(user.id);
        //  console.log("ChatRoom Seeder");
        await new concurrentTaskExec_1.ConcurrentTaskExec(contacts.map(async (contact) => {
            await objects_1.chatService.creatChatRoomDeatils(contact.phone, user.phone, user.id);
        })).executeTasks();
    }
};
exports.ChatRoomSeeder = ChatRoomSeeder;
