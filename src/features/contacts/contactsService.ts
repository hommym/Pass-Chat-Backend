import { database } from "../../common/constants/objects";
import { SavedContactsDto } from "./dtos/savedContactsDto";

export class ContactsService {
  async saveContacts(contacts: string[], userId: number) {
    const contactsWithAccount = await database.user.findMany({ where: { phone: { in: contacts }, type: "user" }, select: { phone: true, profile: true } });

    if (contactsWithAccount.length === 0) return [];
    // const res: { phone: string; profile: string | null }[] = [];
    await Promise.all(
      contactsWithAccount.map(async (data) => {
        const phone = data.phone!;
        const { profile } = data;
        await database.userContact.upsert({
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
      })
    );
  }

  async getSavedContacts(userId: number) {
    const { contacts } = (await database.user.findUnique({ where: { id: userId }, select: { contacts: { select: { phone: true, profile: true,roomId:true } } } }))!;
    return contacts;
  }

  async updateContactsRommId(args: { roomId: number; contacts: { contact: string; ownerId: number }[] }) {
    const { contacts, roomId } = args;
    await Promise.all(
      contacts.map(async (item) => {
        const { contact, ownerId } = item;
        await database.userContact.upsert({ where: { ownerId_phone: { ownerId, phone: contact } }, create: { ownerId, phone: contact, roomId }, update: { roomId } });
      })
    );
  }
}
