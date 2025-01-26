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
    else if (callAction === "startGroupCall") {
    }
    else if (callAction === "cancelPrivateCall") {
        await objects_1.callService.cancelCall(socket);
    }
    else if (callAction === "leaveGroupCall") {
    }
    else {
        // join group call
    }
};
exports.callController = callController;
