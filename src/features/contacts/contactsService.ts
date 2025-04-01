import { chatService, database } from "../../common/constants/objects";
import { BlockContactDto } from "./dtos/blockContactDto";
import { ContactDto } from "./dtos/contactDto";
import { SavedContactsDto } from "./dtos/savedContactsDto";

export class ContactsService {
  async saveContacts(contactsWithNames: ContactDto[], userId: number) {
    const contacts = contactsWithNames.map((items) => items.phone);
    const contactsWithAccount = await database.user.findMany({ where: { phone: { in: contacts }, type: "user" }, select: { phone: true, profile: true } });

    if (contactsWithAccount.length === 0) return [];
    // const res: { phone: string; profile: string | null }[] = [];
    await Promise.all(
      contactsWithAccount.map(async (data) => {
        let contactName: string | null = null;
        const phone = data.phone!;
        for (let item of contactsWithNames) {
          if (item.phone === phone) contactName = item.contactName;
        }
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
            contactName,
          },
          update: {
            phone,
            profile,
            contactName,
          },
        });
      })
    );
  }

  async getSavedContacts(userId: number) {
    const { contacts } = (await database.user.findUnique({ where: { id: userId }, select: { contacts: { omit: { id: true, ownerId: true } } } }))!;
    return Promise.all(
      contacts.map(async (contact) => {
        const { phone } = contact;
        const user = await database.user.findUnique({ where: { phone } });
        const newContactData = contact as any;
        newContactData.bio = user!.bio;
        newContactData.username = user!.username;
        return newContactData;
      })
    );
  }

  async getGlobalContacts(userId: number) {
    const userContacts = (await this.getSavedContacts(userId)).map((contact) => {
      return contact.phone as string;
    });

    // getting all users and filtering out the users contacts(temp)
    const allUsers = await database.user.findMany({ where: { type: "user", id: { not: userId } }, select: { phone: true, profile: true, bio: true, username: true, fullName: true } });
    const globalContact: any[] = [];

    for (let user of allUsers) {
      if (!userContacts.includes(user.phone!)) {
        globalContact.push(user);
      }
    }

    return globalContact;
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

  async blockContact(userId: number, blockContactDto: BlockContactDto) {
    const { action, phone } = blockContactDto;
    //get user account details
    //get chat room details
    const account = await database.user.findUnique({ where: { id: userId } });
    const { roomId, participants } = await chatService.creatChatRoomDeatils(phone, account!.phone!,userId);

    if (action == "block") {
      //set chat room status to block
      //update that contact to block
      await database.chatRoom.update({ where: { id: roomId }, data: { status: "blocked" } });
      await database.userContact.upsert({ where: { ownerId_phone: { ownerId: userId, phone } }, create: { ownerId: userId, phone }, update: { status: "blocked" } });
    } else {
      // unblock the particular contact
      await database.userContact.upsert({ where: { ownerId_phone: { ownerId: userId, phone } }, create: { ownerId: userId, phone }, update: { status: "active" } });

      // checking if other user has blocked client who made the request before updating the chat room.
      for (let participant of participants) {
        const { id } = participant;
        if (id !== userId) {
          const contactDetails = await database.userContact.findUnique({ where: { ownerId_phone: { ownerId: id, phone: account!.phone! } } });

          if (contactDetails?.status === "active") {
            await database.chatRoom.update({ where: { id: roomId }, data: { status: "active" } });
          }
          break;
        }
      }
    }

    return { message: action === "block" ? "User has been blocked sucessfully" : "User has been unblocked sucessfully" };
  }
}
