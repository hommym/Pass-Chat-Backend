"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crossMsgRouter = void 0;
const socket_io_client_1 = require("socket.io-client");
class WSClient {
    constructor(conUrl) {
        this.wsServername = "Cross-Msg-Router";
        this.socket = null;
        this.connect = async () => {
            if (!this.connUrl) {
                throw new Error(`CROSS_MSG_ROUTER_URL env not avialable`);
                return;
            }
            this.socket = (0, socket_io_client_1.io)(this.connUrl);
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
        this.connUrl = conUrl;
    }
    sendData(data) {
        // event name is request
        if (this.socket && this.socket.connected) {
            this.socket.emit('request', data); // Changed to emit 'message' event
            console.log(`Data sent to ${this.wsServername} server`, data);
        }
        else {
            console.error(`${this.wsServername} server is not connected.`);
        }
    }
}
exports.crossMsgRouter = new WSClient(process.env.CROSS_MSG_ROUTER_URL);
