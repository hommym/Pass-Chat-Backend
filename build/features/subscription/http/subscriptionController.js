"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRouter = void 0;
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const verifyJwt_1 = require("../../../common/middlewares/verifyJwt");
const checkAccountType_1 = require("../../../common/middlewares/checkAccountType");
const bodyValidator_1 = require("../../../common/middlewares/bodyValidator");
const createSubscriptionDto_1 = require("../dto/createSubscriptionDto");
const objects_1 = require("../../../common/constants/objects");
const errorHandler_1 = require("../../../common/middlewares/errorHandler");
exports.subscriptionRouter = (0, express_1.Router)();
exports.subscriptionRouter.post("/", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, bodyValidator_1.bodyValidator)(createSubscriptionDto_1.CreateSubscriptionDto), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.subscriptionService.createSubscription(req.body));
}));
exports.subscriptionRouter.get("/", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.subscriptionService.getAllPlans());
}));
exports.subscriptionRouter.delete("/:planId", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, express_async_handler_1.default)(async (req, res) => {
    try {
        res.status(204).json(await objects_1.subscriptionService.deleteSubscription(+req.params.planId));
    }
    catch (error) {
        // console.log(error);
        if (error instanceof errorHandler_1.AppError)
            throw new errorHandler_1.AppError(error.message, error.statusCode);
        throw new errorHandler_1.AppError("Url parameter planId must be an integer", 401);
    }
}));
