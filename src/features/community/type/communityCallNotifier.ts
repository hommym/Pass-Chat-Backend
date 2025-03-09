import { SocketV1 } from "../../../common/helpers/classes/socketV1";

export interface CommunityCallNotifier {
  chatRoomId: number;
  allMembersIds: number[];
  callerId:number
}
