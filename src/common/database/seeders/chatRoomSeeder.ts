import { chatService, contactsService, database } from "../../constants/objects";
import { ConcurrentTaskExec } from "../../helpers/classes/concurrentTaskExec";

export const ChatRoomSeeder = async () => {
  const allMobileUsers = await database.user.findMany({ where: { phone: { not: null }, type: "user" } });

  for (let user of allMobileUsers) {
    const contacts = await contactsService.getSavedContacts(user.id);
 
    //  console.log("ChatRoom Seeder");
    await new ConcurrentTaskExec(
      contacts.map(async (contact) => {
        await chatService.creatChatRoomDeatils(contact.phone, user.phone!, user.id);
      })
    ).executeTasks();
  }
};
