import { OnlineStatus } from "@prisma/client";
import { database } from "../../common/constants/objects";

export class ChatService {
  async setUserOnlineStatus(status: OnlineStatus, userId: number|null,connectionId?:string|undefined) {
    if(userId){
      await database.user.update({ where: { id: userId }, data: { onlineStatus: status ,connectionId} });
      // console.log(`User with id=${userId} is ${status}`);
    }
    else{
      await database.user.update({ where: { connectionId }, data: { onlineStatus: status ,connectionId} });
      //  console.log(`User with id=${user.id} is ${status}`);
    }
  }
}
