"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const objects_1 = require("../../common/constants/objects");
class ContactsService {
    async saveContacts(contactsWithNames, userId) {
        const contacts = contactsWithNames.map((items) => items.phone);
        const contactsWithAccount = await objects_1.database.user.findMany({ where: { phone: { in: contacts }, type: "user" }, select: { phone: true, profile: true } });
        if (contactsWithAccount.length === 0)
            return [];
        // const res: { phone: string; profile: string | null }[] = [];
        await Promise.all(contactsWithAccount.map(async (data) => {
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
        }));
    }
    async getSavedContacts(userId) {
        const { contacts } = (await objects_1.database.user.findUnique({ where: { id: userId }, select: { contacts: { omit: { id: true, ownerId: true } } } }));
        return contacts;
    }
    async updateContactsRommId(args) {
        const { contacts, roomId } = args;
        await Promise.all(contacts.map(async (item) => {
            const { contact, ownerId } = item;
            await objects_1.database.userContact.upsert({ where: { ownerId_phone: { ownerId, phone: contact } }, create: { ownerId, phone: contact, roomId }, update: { roomId } });
        }));
    }
    async blockContact(userId, blockContactDto) {
        const { action, phone } = blockContactDto;
        //get user account details
        //get chat room details
        const account = await objects_1.database.user.findUnique({ where: { id: userId } });
        const { roomId, participants } = await objects_1.chatService.creatChatRoomDeatils(phone, account.phone);
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
