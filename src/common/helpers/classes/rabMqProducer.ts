import { rabbitMq } from "../../libs/rabitMq";

class RabitMQProducer {
  private qName?: string;

  constructor (qName?: string) {
    if (!qName) throw new Error("No Value provided for CROSSMSGROUTERNAME env");
    this.qName = qName;
  }

  init = async () => {
    await rabbitMq.ch.assertQueue(this.qName!, { durable: true });
  };

  publish = (data: string) => {
    console.log(`Publishing Data to ${this.qName} queue..`);
    const isP = rabbitMq.ch.sendToQueue(this.qName!, Buffer.from(data), { persistent: true });
    if (isP) console.log(`Data published sucessfully to ${this.qName}`);
  };
}

export const producer = new RabitMQProducer(process.env.CROSS_MSG_ROUTER_QNAME);
