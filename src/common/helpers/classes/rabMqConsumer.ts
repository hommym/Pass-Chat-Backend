import dotenv from "dotenv";
dotenv.config();
import { rabbitMq } from "../../libs/rabitMq";
import { ConsumeMessage } from "amqplib";
import { redis } from "../../libs/redis";
import { User } from "@prisma/client";
import { chatRouterWs } from "../../../features/chat/ws/chatHandler";

class RabitMQConsumer {
  port = process.env.WSSERVERPORT!;
  private qName?: string;
  constructor(qName?: string) {
    if (!qName) throw new Error("No Value provided for CROSSMSGROUTERNAME env");
    this.qName = qName;
  }

  private sendData = async (account: User, wsEventName: string, data: any) => {
    const connectionIds = [account.connectionId, account.webConnectionId];
    const platformStatuses = [account.onlineStatus, account.onlineStatusWeb];

    for (let i = 0; i < connectionIds.length; i++) {
      if (platformStatuses[i] !== "offline") {
        const userConnection = chatRouterWs.sockets.get(connectionIds[i]!);
        if (userConnection) {
          console.log(`Emmiting data with evenName:${wsEventName} and data:${data}`)
          userConnection.emit(wsEventName, data);
          continue;
        } else {
          // component for resending when  user is back online
        }
      }
    }
  };
  init = async () => {
    await rabbitMq.ch.consume(this.qName!, async (msg) => {
      // console.log(`Consuming data from ${this.qName} queue...`);

      // code for processing consumed data(N/a)
      const producerData: { wsEventName: string; data: any } = JSON.parse(msg!.content.toString());
      const { recipientId, ...dataToSend } = producerData.data;
      const cache = await redis.getCachedData(`${this.port}:${recipientId}`);

      const account = cache ? (JSON.parse(cache) as User) : null;
      if (account) {
        await this.sendData(account, producerData.wsEventName, dataToSend);
        // send rabbit mq ack
        rabbitMq.ch.ack(msg!);
      }

      console.log("Data consumed");
    });
  };
}

export const consumer = new RabitMQConsumer(process.env.CROSS_MSG_ROUTER_QNAME);
