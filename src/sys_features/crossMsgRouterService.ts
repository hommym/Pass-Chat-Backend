import { producer } from "../common/helpers/classes/rabMqProducer"





class CrossMsgRouterService{


    publishMessage(body:string){
        // publish to msgrouter exchange
        producer.publish(body)
    }


}

export const cMRService=new CrossMsgRouterService()