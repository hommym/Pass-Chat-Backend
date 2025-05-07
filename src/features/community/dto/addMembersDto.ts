import { Expose } from "class-transformer";
import { IsArray, IsInt, IsPhoneNumber } from "class-validator";


export class AddMembersDto{


    @Expose()
    @IsInt()
    communityId:number

    @Expose()
    @IsArray()
    @IsPhoneNumber(undefined,{each:true})
    membersPhone:string[];

}