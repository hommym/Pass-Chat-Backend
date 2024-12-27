import { Expose } from "class-transformer";
import { IsIn } from "class-validator";



export class AuthWsRequestDto{


    @Expose()
    @IsIn(["createLoginQrCode"])
    action:"createLoginQrCode"


}