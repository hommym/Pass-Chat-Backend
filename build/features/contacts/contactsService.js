"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const objects_1 = require("../../common/constants/objects");
const concurrentTaskExec_1 = require("../../common/helpers/classes/concurrentTaskExec");
class ContactsService {
    async saveContacts(contactsWithNames, userId) {
        const contacts = contactsWithNames.map((items) => items.phone);
        const contactsWithAccount = await objects_1.database.user.findMany({ where: { phone: { in: contacts }, type: "user" }, select: { phone: true, profile: true } });
        if (contactsWithAccount.length === 0)
            return [];
        // const res: { phone: string; profile: string | null }[] = [];
        await new concurrentTaskExec_1.ConcurrentTaskExec(contactsWithAccount.map(async (data) => {
            let contactName = null;
            const phone = data.phone;
            for (let item of contactsWithNames) {
                if (item.phone === phone)
                    contactName = item.contactName;
            }
            const { profile } = data;
            await objects_1.database.userContact.upsert({
                where: {
                    ownerId_phone: {
                        ownerId: userId,
                        phone,
                    },
                },
                create: {
                    ownerId: userId,
                    phone,
                    profile,
                    contactName,
                },
                update: {
                    phone,
                    profile,
                    contactName,
                },
            });
        })).executeTasks();
    }
    async getSavedContacts(userId) {
        const { contacts } = (await objects_1.database.user.findUnique({ where: { id: userId }, select: { contacts: { omit: { id: true, ownerId: true } } } }));
        return await new concurrentTaskExec_1.ConcurrentTaskExec(contacts.map(async (contact) => {
            const { phone } = contact;
            const user = await objects_1.database.user.findUnique({ where: { phone } });
            const newContactData = contact;
            newContactData.bio = user.bio;
            newContactData.username = user.username;
            return newContactData;
        })).executeTasks();
    }
    async getGlobalContacts(userId) {
        const userContacts = (await this.getSavedContacts(userId)).map((contact) => {
            return contact.phone;
        });
        // getting all users and filtering out the users contacts(temp)
        const allUsers = await objects_1.database.user.findMany({ where: { type: "user", id: { not: userId } }, select: { phone: true, profile: true, bio: true, username: true, fullName: true } });
        const globalContact = [];
        for (let user of allUsers) {
            if (!userContacts.includes(user.phone)) {
                globalContact.push(user);
            }
        }
        return globalContact;
    }
    async updateContactsRommId(args) {
        const { contacts, roomId } = args;
        await new concurrentTaskExec_1.ConcurrentTaskExec(contacts.map(async (item) => {
            const { contact, ownerId } = item;
            await objects_1.database.userContact.upsert({ where: { ownerId_phone: { ownerId, phone: contact } }, create: { ownerId, phone: contact, roomId }, update: { roomId } });
        })).executeTasks();
    }
    async blockContact(userId, blockContactDto) {
        const { action, phone } = blockContactDto;
        //get user account details
        //get chat room details
        const account = await objects_1.database.user.findUnique({ where: { id: userId } });
        const { roomId, participants } = await objects_1.chatService.creatChatRoomDeatils(phone, account.phone, userId);
        if (action == "block") {
            //set chat room status to block
            //update that contact to block
            await objects_1.database.chatRoom.update({ where: { id: roomId }, data: { status: "blocked" } });
            await objects_1.database.userContact.upsert({ where: { ownerId_phone: { ownerId: userId, phone } }, create: { ownerId: userId, phone }, update: { status: "blocked" } });
        }
        else {
            // unblock the particular contact
            await objects_1.database.userContact.upsert({ where: { ownerId_phone: { ownerId: userId, phone } }, create: { ownerId: userId, phone }, update: { status: "active" } });
            // checking if other user has blocked client who made the request before updating the chat room.
            for (let participant of participants) {
                const { id } = participant;
                if (id !== userId) {
                    const contactDetails = await objects_1.database.userContact.findUnique({ where: { ownerId_phone: { ownerId: id, phone: account.phone } } });
                    if ((contactDetails === null || contactDetails === void 0 ? void 0 : contactDetails.status) === "active") {
                        await objects_1.database.chatRoom.update({ where: { id: roomId }, data: { status: "active" } });
                    }
                    break;
                }
            }
        }
        return { message: action === "block" ? "User has been blocked sucessfully" : "User has been unblocked sucessfully" };
    }
}
exports.ContactsService = ContactsService;
