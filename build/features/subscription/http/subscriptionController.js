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
const express_2 = __importDefault(require("express"));
exports.subscriptionRouter = (0, express_1.Router)();
exports.subscriptionRouter.post("/", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("admin"), (0, bodyValidator_1.bodyValidator)(createSubscriptionDto_1.CreateSubscriptionDto), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.subscriptionService.createSubscription(req.body));
}));
exports.subscriptionRouter.post("/cancel/:type", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("user"), (0, express_async_handler_1.default)(async (req, res) => {
    const type = req.params.type;
    if (["now", "later"].includes(type))
        res.status(200).json(await objects_1.subscriptionService.cancelSubscriptionPlan(req.body.verifiedUserId, type));
    else
        throw new errorHandler_1.AppError("Url Parameter type, must be of the value now or later", 400);
}));
exports.subscriptionRouter.post("/subscribe/:planId", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("user"), (0, express_async_handler_1.default)(async (req, res) => {
    let planId;
    try {
        planId = +req.params.planId;
    }
    catch (error) {
        throw new errorHandler_1.AppError("Url parameter planId must be an integer", 400);
    }
    res.status(200).json(await objects_1.subscriptionService.subscribeToPlan(planId, req.body.verifiedUserId));
}));
exports.subscriptionRouter.patch("/subscribe/:planId", verifyJwt_1.verifyJwt, (0, checkAccountType_1.checkAccountType)("user"), (0, express_async_handler_1.default)(async (req, res) => {
    let planId;
    try {
        planId = +req.params.planId;
    }
    catch (error) {
        throw new errorHandler_1.AppError("Url parameter planId must be an integer", 400);
    }
    res.status(200).json(await objects_1.subscriptionService.changeSubscriptionPlan(planId, req.body.verifiedUserId));
}));
exports.subscriptionRouter.post("/webhooks/checkout", express_2.default.raw({ type: "application/json" }), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.subscriptionService.checkOutSessionHandler(req.body, req.headers["stripe-signature"]));
}));
exports.subscriptionRouter.post("/webhooks/invoices", express_2.default.raw({ type: "application/json" }), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.subscriptionService.invoiceEventsHandler(req.body, req.headers["stripe-signature"]));
}));
exports.subscriptionRouter.post("/webhooks/subscriptions", express_2.default.raw({ type: "application/json" }), (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json(await objects_1.subscriptionService.subscriptionEventsHandler(req.body, req.headers["stripe-signature"]));
}));
exports.subscriptionRouter.get("/:userType", verifyJwt_1.verifyJwt, (0, express_async_handler_1.default)(async (req, res) => {
    const { userType } = req.params;
    const { verifiedUserId } = req.body;
    const isUserTypeValid = ["admin", "norm"].includes(userType);
    if (!isUserTypeValid)
        throw new errorHandler_1.AppError("Url parameter userType should be of values admin or norm", 400);
    res.status(200).json(await objects_1.subscriptionService.getAllPlans(userType === "admin", verifiedUserId));
}));
// subscriptionRouter.delete(
//   "/:planId",
//   verifyJwt,
//   checkAccountType("admin"),
//   asyncHandler(async (req: Request, res: Response) => {
//     try {
//       res.status(204).json(await subscriptionService.deleteSubscription(+req.params.planId));
//     } catch (error) {
//       // console.log(error);
//       if (error instanceof AppError) throw new AppError(error.message, error.statusCode);
//       throw new AppError("Url parameter planId must be an integer", 401);
//     }
//   })
// );
