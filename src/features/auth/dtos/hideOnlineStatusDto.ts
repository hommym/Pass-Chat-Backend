import { Expose } from "class-transformer";
import { IsBoolean } from "class-validator";



export class HideOnlineStatusDto{


    @Expose()
    @IsBoolean()
    hide:boolean


}