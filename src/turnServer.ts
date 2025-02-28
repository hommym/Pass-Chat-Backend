import dotenv from "dotenv";
dotenv.config();
import Turn from "node-turn";


const server = new Turn({
  // set options
  authMech: "long-term",
  credentials: {
    paschatAdmin: process.env.TurnServerPassword ? process.env.TurnServerPassword : "XoXo",
  },
  realm: process.env.DomainName,
});
server.start();
console.log("Node TURN server is running on port 3478");