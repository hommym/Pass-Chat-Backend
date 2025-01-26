"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
class Websocket {
    constructor(wsUrl, authToken = undefined) {
        this.responseEventHandler = async (data) => {
            console.log(data);
        };
        this.errorEventHandler = async (data) => {
            console.log(`Bad Request:${data}`);
        };
        this.callResponseEventHandler = async (data) => {
            console.log(data);
        };
        this.onConnectEventHandler = () => {
            console.log("Connected to the server");
            this.listenToEventsFromServer();
        };
        this.wsUrl = wsUrl;
        this.authToken = authToken;
    }
    listenToEventsFromServer() {
        // this is where we listen and process events and data recieved from the server
        this.socketIntance.on("response", this.responseEventHandler);
        this.socketIntance.on("callResponse", this.callResponseEventHandler);
        this.socketIntance.on("error", this.errorEventHandler);
    }
    updateEventHandlers(eventName, handler) {
        if (eventName === "response") {
            this.responseEventHandler = handler;
        }
        else if (eventName === "callResponse") {
            this.callResponseEventHandler = handler;
        }
        else if (eventName === "error") {
            this.errorEventHandler = handler;
        }
        else {
            this.onConnectEventHandler = handler;
        }
    }
    connect() {
        this.socketIntance = this.authToken
            ? (0, socket_io_client_1.io)(this.wsUrl, {
                auth: { token: this.authToken },
            })
            : (0, socket_io_client_1.io)(this.wsUrl);
        this.socketIntance.on("connect", this.onConnectEventHandler);
        this.socketIntance.on("connect_error", (err) => {
            console.error(`Connection failed: ${err.message}`);
        });
        this.socketIntance.on("disconnect", () => {
            console.log("Disconnected from the server");
        });
    }
    sendWsRequest(data) {
        this.socketIntance.emit("request", data);
    }
}
