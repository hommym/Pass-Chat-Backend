import dotenv from "dotenv";
dotenv.config();
import { rabbitMq } from "../../libs/rabitMq";
import { ConsumeMessage } from "amqplib";

class RabitMQConsumer {
  private qName?: string;
  constructor(qName?: string) {
    if(!qName) throw new Error("No Value provided for CROSSMSGROUTERNAME env");
    this.qName=qName;
  }



  

  init = async()=>{
   await rabbitMq.ch.consume(this.qName!,async(msg)=>{
        console.log(`Consuming data from ${this.qName} queue...`)
        
        // code for processing consumed data

        console.log("Data consumed")
    })

  }

}

export const consumer = new RabitMQConsumer(process.env.CROSS_MSG_ROUTER_QNAME);
