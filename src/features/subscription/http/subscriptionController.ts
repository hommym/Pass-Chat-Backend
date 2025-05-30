import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { verifyJwt } from "../../../common/middlewares/verifyJwt";
import { checkAccountType } from "../../../common/middlewares/checkAccountType";
import { bodyValidator } from "../../../common/middlewares/bodyValidator";
import { CreateSubscriptionDto } from "../dto/createSubscriptionDto";
import { subscriptionService } from "../../../common/constants/objects";
import { AppError } from "../../../common/middlewares/errorHandler";
import express from "express";

export const subscriptionRouter = Router();

subscriptionRouter.post(
  "/",
  verifyJwt,
  checkAccountType("admin"),
  bodyValidator(CreateSubscriptionDto),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await subscriptionService.createSubscription(req.body));
  })
);

subscriptionRouter.post(
  "/cancel/:type",
  verifyJwt,
  checkAccountType("user"),
  asyncHandler(async (req: Request, res: Response) => {
    const type = req.params.type;
    if (["now", "later"].includes(type)) res.status(200).json(await subscriptionService.cancelSubscriptionPlan(req.body.verifiedUserId, type as any));
    else throw new AppError("Url Parameter type, must be of the value now or later", 400);
  })
);

subscriptionRouter.post(
  "/subscribe/:planId",
  verifyJwt,
  checkAccountType("user"),
  asyncHandler(async (req: Request, res: Response) => {
    let planId: number;
    try {
      planId = +req.params.planId;
    } catch (error) {
      throw new AppError("Url parameter planId must be an integer", 400);
    }
    res.status(200).json(await subscriptionService.subscribeToPlan(planId, req.body.verifiedUserId));
  })
);

subscriptionRouter.patch(
  "/subscribe/:planId",
  verifyJwt,
  checkAccountType("user"),
  asyncHandler(async (req: Request, res: Response) => {
    let planId: number;
    try {
      planId = +req.params.planId;
    } catch (error) {
      throw new AppError("Url parameter planId must be an integer", 400);
    }
    res.status(200).json(await subscriptionService.changeSubscriptionPlan(planId, req.body.verifiedUserId));
  })
);

subscriptionRouter.post(
  "/webhooks/checkout",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await subscriptionService.checkOutSessionHandler(req.body, req.headers["stripe-signature"]!));
  })
);

subscriptionRouter.post(
  "/webhooks/invoices",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await subscriptionService.invoiceEventsHandler(req.body, req.headers["stripe-signature"]!));
  })
);

subscriptionRouter.post(
  "/webhooks/subscriptions",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await subscriptionService.subscriptionEventsHandler(req.body, req.headers["stripe-signature"]!));
  })
);

subscriptionRouter.get(
  "/:userType",
  verifyJwt,
  asyncHandler(async (req: Request, res: Response) => {
    const { userType } = req.params;
    const { verifiedUserId } = req.body;
    const isUserTypeValid = ["admin", "norm"].includes(userType);
    if (!isUserTypeValid) throw new AppError("Url parameter userType should be of values admin or norm", 400);
    res.status(200).json(await subscriptionService.getAllPlans(userType === "admin", verifiedUserId));
  })
);

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
