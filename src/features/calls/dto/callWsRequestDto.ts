import {} from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsIn, IsNotEmptyObject } from "class-validator";

export class CallWsRequestDto {
  @Expose()
  @IsIn(["sendSDPOffer", "sendSDPAnswer", "sendICEDetails", "startPublicGroupCall", "joinGroupCall", "leaveGroupCall", "endCall"])
  callAction: "sendSDPOffer" | "sendSDPAnswer" | "sendICEDetails" | "startPublicGroupCall" | "joinGroupCall" | "leaveGroupCall" | "endCall";

  @Expose()
  @IsNotEmptyObject()
  details: object;
}
