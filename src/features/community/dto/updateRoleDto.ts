import { CommunityRole } from "@prisma/client";
import { Expose } from "class-transformer";
import { IsEnum, IsPhoneNumber } from "class-validator";



export class UpdateRoleDto{

    @Expose()
    @IsPhoneNumber()
    memberPhone:string;

    @Expose()
    @IsEnum(CommunityRole)
    newRole:CommunityRole
}