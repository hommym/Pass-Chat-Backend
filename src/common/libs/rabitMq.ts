import dotenv from "dotenv";
dotenv.config();
import rabmq, { ChannelModel,ConfirmChannel } from "amqplib";

class RabbitMq {
  private connUrl = process.env.RABBITMQ_URL;

  private connection?: ChannelModel;
  private channel:ConfirmChannel;

  constructor() {
    if (!this.connUrl) throw new Error("RabbitMq Error:No RABBITMQ_URL env provided");
  }

  connect = async () => {
    console.log("Connecting to RabitMQ...");
    this.connection = await rabmq.connect(this.connUrl!);
    this.connection.on("error", (err) => {
      console.log(`RabitMQ Connection Error:${err}`);
    });
    this.connection.on("close", () => {
      console.log("RabitMq connection closed");
      this.connection = undefined;
    });

    console.log("RabitMQ Connected Successfully");
  };

  createChannel = async () => {
    if (!this.connection) throw new Error("Error Creating Channel: RabbitMQ is not connected");
     this.channel= await this.connection.createConfirmChannel()

     this.channel.on("error", (err) => {
      console.log(`RabitMQ Channel Creation Error:${err}`);
     });
     this.channel.on("close", () => {
        console.log("RabbitMQ channel closed")
       // channel closed; next operations should re-create channel (N/A)
     });
  };

  get ch(){  // getter for channel
    return this.channel;
  }


}

export const rabbitMq = new RabbitMq();
