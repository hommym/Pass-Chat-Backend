import { chatService, contactsService, database } from "../../constants/objects";

export const ChatRoomSeeder = async () => {
  const allMobileUsers = await database.user.findMany({ where: { phone: { not: null }, type: "user" } });

  for (let user of allMobileUsers) {
    const contacts = await contactsService.getSavedContacts(user.id);
    await Promise.all(
      contacts.map(async (contact) => {
        await chatService.creatChatRoomDeatils(contact.phone, user.phone!, user.id);
      })
    );
  }
};
