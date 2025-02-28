"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const node_turn_1 = __importDefault(require("node-turn"));
const server = new node_turn_1.default({
    // set options
    authMech: "long-term",
    credentials: {
        paschatAdmin: process.env.TurnServerPassword ? process.env.TurnServerPassword : "XoXo",
    },
    realm: process.env.BaseUrl,
});
server.start();
console.log("Node TURN server is running on port 3478");
