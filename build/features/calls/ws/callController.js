"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callController = void 0;
const objects_1 = require("../../../common/constants/objects");
const callController = async (socket, request) => {
    const { details, callAction } = request;
    if (callAction === "sendSDPOffer") {
        await objects_1.callService.sendSdpOffer(socket, details);
    }
    else if (callAction === "sendSDPAnswer") {
        await objects_1.callService.sendSdpAnswer(socket, details);
    }
    else if (callAction === "sendICEDetails") {
        await objects_1.callService.sendIceDetails(socket, details);
    }
    else if (callAction === "startPublicGroupCall") {
        await objects_1.callService.startPublicGroupCall(details, socket);
    }
    else if (callAction === "endCall") {
        await objects_1.callService.endCall(socket, details);
    }
    else {
        // join group call
    }
};
exports.callController = callController;
