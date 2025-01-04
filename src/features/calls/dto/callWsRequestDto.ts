import {} from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsIn, IsNotEmptyObject } from "class-validator";

export class CallWsRequestDto {
  @Expose()
  @IsIn(["sendSDPOffer", "sendSDPAnswer", "sendICEDetails", "startGroupCall", "joinGroupCall"])
  callAction: "sendSDPOffer" | "sendSDPAnswer" | "sendICEDetails" | "startGroupCall" | "joinGroupCall";

  @Expose()
  @IsNotEmptyObject()
  details: object;
}
