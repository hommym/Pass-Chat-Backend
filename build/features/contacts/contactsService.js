"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const objects_1 = require("../../common/constants/objects");
class ContactsService {
    async saveContacts(contacts, userId) {
        const contactsWithAccount = await objects_1.database.user.findMany({ where: { phone: { in: contacts }, type: "user" }, select: { phone: true, profile: true } });
        if (contactsWithAccount.length === 0)
            return [];
        // const res: { phone: string; profile: string | null }[] = [];
        await Promise.all(contactsWithAccount.map(async (data) => {
            const phone = data.phone;
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
                },
                update: {
                    phone,
                    profile,
                },
                select: { ownerId: false, phone: true, profile: true },
            });
        }));
    }
    async getSavedContacts(userId) {
        const { contacts } = (await objects_1.database.user.findUnique({ where: { id: userId }, select: { contacts: { select: { phone: true, profile: true, roomId: true } } } }));
        return contacts;
    }
    async updateContactsRommId(args) {
        const { contacts, roomId } = args;
        await Promise.all(contacts.map(async (item) => {
            const { contact, ownerId } = item;
            await objects_1.database.userContact.upsert({ where: { ownerId_phone: { ownerId, phone: contact } }, create: { ownerId, phone: contact, roomId }, update: { roomId } });
        }));
    }
}
exports.ContactsService = ContactsService;
