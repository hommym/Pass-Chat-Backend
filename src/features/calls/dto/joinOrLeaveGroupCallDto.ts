import { Expose } from "class-transformer";
import { IsInt } from "class-validator";


export class JoinOrLeaveGroupCallDto{

    @Expose()
    @IsInt()
    callRoomId:number


}