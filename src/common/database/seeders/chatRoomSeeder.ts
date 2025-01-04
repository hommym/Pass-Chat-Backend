import { chatService, contactsService, database } from "../../constants/objects";

export const ChatRoomSeeder = async () => {
  const allMobileUsers = await database.user.findMany({ where: { phone: { not: null } } });

  allMobileUsers.forEach(async (user) => {
    const contacts = await contactsService.getSavedContacts(user.id);
    contacts.forEach(async (contact) => {
      await chatService.creatChatRoomDeatils(contact.phone, user.phone!);
    });
  });
};
