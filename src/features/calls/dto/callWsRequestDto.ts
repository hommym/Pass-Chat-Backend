import {} from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsIn, IsNotEmptyObject } from "class-validator";

export class CallWsRequestDto {
  @Expose()
  @IsIn(["sendSDPOffer", "sendSDPAnswer", "sendICEDetails", "startGroupCall", "joinGroupCall", "leaveGroupCall", "endCall"])
  callAction: "sendSDPOffer" | "sendSDPAnswer" | "sendICEDetails" | "startGroupCall" | "joinGroupCall" | "leaveGroupCall" | "endCall";

  @Expose()
  @IsNotEmptyObject()
  details: object;
}
