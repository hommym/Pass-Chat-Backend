import { io, Socket } from "socket.io-client";

class WSClient {
  private wsServername = "Msg-Router";
  private connUrl?: string;
  private socket: Socket | null = null;

  constructor(conUrl?: string) {
    this.connUrl = conUrl;
  }

  connect = async () => {
    if (!this.connUrl) {
      throw new Error(`MSG_ROUTER_URL env not avialable`);
      return;
    }

    this.socket = io(this.connUrl);

    this.socket.on("connect", () => {
      console.log(`Connected to ${this.wsServername} server`);
    });

    this.socket.on("connect_error", (error) => {
      console.error(`${this.wsServername} connection error:`, error);
    });

    this.socket.on("disconnect", () => {
      console.log(`Disconnected from ${this.wsServername} server`);
    });
  };

  sendData(data: string) {
    // event name is request
    if (this.socket && this.socket.connected) {
      this.socket.emit("request", data); // Changed to emit 'message' event
      console.log(`Data sent to ${this.wsServername} server`, data);
    } else {
      console.error(`${this.wsServername} server is not connected.`);
    }
  }
}

export const msgRouter = new WSClient(process.env.MSG_ROUTER_URL);
