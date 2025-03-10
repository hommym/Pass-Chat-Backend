"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callController = void 0;
const objects_1 = require("../../../common/constants/objects");
const callController = async (socket, request) => {
    const { details, callAction } = request;
    switch (callAction) {
        case "sendSDPOffer":
            await objects_1.callService.sendSdpOffer(socket, details);
            break;
        case "sendSDPAnswer":
            await objects_1.callService.sendSdpAnswer(socket, details);
            break;
        case "sendICEDetails":
            await objects_1.callService.sendIceDetails(socket, details);
            break;
        case "startPublicGroupCall":
            await objects_1.callService.startPublicGroupCall(details, socket);
            break;
        case "endCall":
            await objects_1.callService.endCall(socket, details);
            break;
        case "leaveGroupCall":
            await objects_1.callService.joinOrLeaveGroupCall(socket, details, "leave");
            break;
        default:
            await objects_1.callService.joinOrLeaveGroupCall(socket, details);
            break;
    }
};
exports.callController = callController;
