import { Expose } from "class-transformer";
import { IsInt } from "class-validator";



export class CheckStatusDto{

    @Expose()
    @IsInt()
    userId:number
}