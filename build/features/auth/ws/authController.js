"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authWsRequestDto_1 = require("../dtos/authWsRequestDto");
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const objects_1 = require("../../../common/constants/objects");
const authController = async (socket, request) => {
    (0, bodyValidator_1.bodyValidatorWs)(authWsRequestDto_1.AuthWsRequestDto, request);
    const { action } = request;
    if (action === "createLoginQrCode") {
        await objects_1.authService.createLoginQrCode(socket);
    }
    // other actions
};
exports.authController = authController;
