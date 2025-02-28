import { Expose } from "class-transformer";
import { IsArray, IsInt, IsString } from "class-validator";

export class CancelCallDto {
 
    @Expose()
    @IsArray()
    @IsInt({each:true})
    participantsIds:number[]


}
