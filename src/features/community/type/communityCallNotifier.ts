import { CallType } from "@prisma/client";
import { SocketV1 } from "../../../common/helpers/classes/socketV1";

export interface CommunityCallNotifier {
  chatRoomId: number;
  callRoomId: number;
  allMembersIds: number[];
  callerId: number;
  callType:CallType;
}
