import { Expose } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsString } from "class-validator";





export class UpdateCommunityVerificationStatus {

  @Expose()  
  @IsInt()
  verificationRequestId: number;

  @Expose()
  @IsIn(["accept","decline"])
  action: "accept" | "decline";

  @Expose()
  @IsString()
  @IsNotEmpty()
  reason:string
}
