"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwtForWs = exports.verifyJwt = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorHandler_1 = require("./errorHandler");
const jwt_1 = require("../libs/jwt");
const objects_1 = require("../constants/objects");
exports.verifyJwt = (0, express_async_handler_1.default)(async (req, res, next) => {
    // console.log("Jwt verification began....");
    if (req.headers !== undefined && req.headers.authorization !== undefined) {
        if (!req.headers.authorization.startsWith("Bearer ")) {
            res.status(400);
            throw new errorHandler_1.AppError("Bad Request Bearer schema not found in Header", 400);
        }
        try {
            const jwtData = (0, jwt_1.verifyJwtToken)(req.headers.authorization.split(" ")[1]);
            //  if (!jwtData.userId) {
            //    throw new AppError("Token has expired or is not valid", 401);
            //  }
            //  console.log("Jwt token Verified");
            // the if statement is temporary
            if (!(await objects_1.database.user.findUnique({ where: { id: jwtData.userId } })))
                throw new errorHandler_1.AppError("", 404);
            req.body.verifiedUserId = jwtData.userId;
            next();
        }
        catch (error) {
            throw new errorHandler_1.AppError("Token has expired or is not valid", 401);
        }
    }
    else {
        throw new errorHandler_1.AppError("Authorization Header not defined", 400);
    }
});
const verifyJwtForWs = async (socket, next) => {
    var _a, _b, _c;
    const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ? (_b = socket.handshake.auth) === null || _b === void 0 ? void 0 : _b.token : (_c = socket.handshake.headers.authorization) === null || _c === void 0 ? void 0 : _c.split(" ")[1];
    const setOnlineStatus = socket.handshake.query.setOnlineStatus;
    const platform = socket.handshake.query.platform && ["ios", "desktop", "android"].includes(socket.handshake.query.platform) ? socket.handshake.query.platform : "android";
    const timezone = socket.handshake.query.platform ? socket.handshake.query.timezone : "Africa/Acrra";
    if (!token) {
        next(new Error("No Auth Token Provided"));
    }
    try {
        const jwtData = (0, jwt_1.verifyJwtToken)(token);
        // adding usrs to online users
        const userId = jwtData.userId;
        // checking if user is already online
        if (setOnlineStatus) {
            const userDetails = await objects_1.database.user.findUnique({ where: { id: userId } });
            if (userDetails.onlineStatus !== "offline")
                return next(new errorHandler_1.WsError("User Already Online"));
            else if (userDetails.status !== "active")
                return next(new errorHandler_1.WsError(`Account has been ${userDetails.status}`));
            await objects_1.chatService.setUserOnlineStatus("online", userId, socket.id);
            objects_1.appEvents.emit("add-to-daily-users", { userId, platform, timezone });
        }
        socket.authUserId = userId;
        console.log(`User Verified id=${jwtData.userId}`);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.verifyJwtForWs = verifyJwtForWs;
