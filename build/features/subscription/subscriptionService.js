"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const objects_1 = require("../../common/constants/objects");
const errorHandler_1 = require("../../common/middlewares/errorHandler");
const stripe_1 = require("stripe");
class SubscriptionService {
    constructor(paymentSecret) {
        this.webhookSecret = process.env.CHECKOUT_WEBHOOKSECRET ? process.env.CHECKOUT_WEBHOOKSECRET : "";
        this.paymentGateway = new stripe_1.Stripe(paymentSecret);
    }
    async createSubscription(subDto) {
        // this methods create a subcription plan if the plan does not exist and updates it if it exist
        const { name, price, benefit, description, interval } = subDto;
        // save subscription data in db(upsert)
        let subPlan = await objects_1.database.subscriptionPlan.findUnique({ where: { name_interval: { name, interval } } });
        if (subPlan)
            throw new errorHandler_1.AppError(`Subscription Plan Already exist`, 409);
        subPlan = await objects_1.database.subscriptionPlan.create({ data: { name, description, price, interval, benefit: JSON.parse(JSON.stringify(benefit)) } });
        const stripeProduct = await this.paymentGateway.products.create({ name, description });
        const stripePrice = await this.paymentGateway.prices.create({ currency: "usd", unit_amount: price, recurring: { interval }, product: stripeProduct.id });
        await objects_1.database.subscriptionPlan.update({ where: { id: subPlan.id }, data: { stripProductId: stripeProduct.id, stripePriceId: stripePrice.id } });
        return { message: "Subscription Created Successfully" };
    }
    async getAllPlans(isAdmin = false, userId) {
        // this method will be update to select the current plan for user
        const allPlans = await objects_1.database.subscriptionPlan.findMany({ omit: { stripePriceId: true, stripProductId: true } });
        if (isAdmin)
            return { allPlans };
        const userSubscription = await objects_1.database.userSubscription.findMany({ where: { userId, status: { in: ["paid", "unPaid"] } } });
        const userSubPlanId = userSubscription.length === 0 ? null : userSubscription[0].planId;
        return { userSubPlanId, allPlans };
    }
    async checkPrevOrActiveSubs(userId, planId) {
        // this methods checks user's sub history and returns any prev subs on the plan been subscribed to
        //else throws an error if user is already on active subscrition
        const activeSubs = await objects_1.database.userSubscription.findMany({ where: { userId, status: { in: ["paid", "unPaid"] } } });
        if (activeSubs.length > 0)
            throw new errorHandler_1.AppError("User Already Has An Active Subscription Plan", 409);
        const prevSubs = await objects_1.database.userSubscription.findMany({ where: { userId }, include: { user: true, subPlan: true } });
        return prevSubs.length > 0 ? prevSubs[0] : null;
    }
    async checkPlan(planId) {
        const planDetails = await objects_1.database.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!planDetails)
            throw new errorHandler_1.AppError("No Subscription Plan with such id exist ", 404);
        return planDetails;
    }
    async subscribeToPlan(planId, userId) {
        let checkoutSession;
        const planDetails = await this.checkPlan(planId);
        const hasUserSubBefore = await this.checkPrevOrActiveSubs(userId, planId);
        const returnUrl = process.env.SUCCESSFULL_PAYMENT_URL ? process.env.SUCCESSFULL_PAYMENT_URL : "https://call3.paschat.net";
        if (hasUserSubBefore) {
            const { stripeCustomerId } = hasUserSubBefore;
            checkoutSession = await this.paymentGateway.checkout.sessions.create({
                success_url: returnUrl,
                customer: stripeCustomerId,
                line_items: [{ price: planDetails.stripePriceId, quantity: 1 }],
                mode: "subscription",
                payment_method_types: ["card"],
            });
        }
        else {
            checkoutSession = await this.paymentGateway.checkout.sessions.create({
                success_url: returnUrl,
                line_items: [{ price: planDetails.stripePriceId, quantity: 1 }],
                mode: "subscription",
                payment_method_types: ["card"],
            });
        }
        await objects_1.database.checkoutSession.create({ data: { sessionId: checkoutSession.id, planId, userId } });
        return { checkoutPage: checkoutSession.url };
    }
    async cancelSubscriptionPlan(userId, type) {
        const activeSubs = await objects_1.database.userSubscription.findMany({ where: { userId, status: { in: ["paid", "unPaid"] } } });
        if (activeSubs.length === 0)
            throw new errorHandler_1.AppError("User not on any plan", 404);
        const { subId } = activeSubs[0];
        if (type === "later")
            await this.paymentGateway.subscriptions.update(subId, { cancel_at_period_end: true });
        else
            this, this.paymentGateway.subscriptions.cancel(subId);
        // update users account using the webhook event under subscriptions
        return { message: "Subscription Cancelled Successfully" };
    }
    async changeSubscriptionPlan(planId, userId) {
        const planDetails = await this.checkPlan(planId);
        const isUserOnThisPlan = await objects_1.database.userSubscription.findUnique({ where: { planId_userId: { planId, userId }, status: { in: ["paid", "unPaid"] } } });
        if (isUserOnThisPlan)
            throw new errorHandler_1.AppError("User is already on this plan", 402);
        const activeSubs = await objects_1.database.userSubscription.findMany({ where: { userId, status: { in: ["paid", "unPaid"] } } });
        if (activeSubs.length === 0)
            throw new errorHandler_1.AppError("User must be on A Subscription in order to change", 402);
        const activeSub = activeSubs[0];
        const subscriptionDetails = await this.paymentGateway.subscriptions.retrieve(activeSub.subId);
        const subItem = subscriptionDetails.items.data[0];
        await this.paymentGateway.subscriptions.update(activeSub.subId, { items: [{ id: subItem.id, price: planDetails.stripePriceId }] });
        await objects_1.database.userSubscription.update({ where: { subId: activeSub.subId }, data: { status: "pending" } });
        return { message: "Subscription plan update was successfull, awaiting payment" };
    }
    getEventObject(reqBody, sig, ws = null) {
        if (ws)
            return this.paymentGateway.webhooks.constructEvent(reqBody, sig, ws);
        return this.paymentGateway.webhooks.constructEvent(reqBody, sig, this.webhookSecret);
    }
    async checkOutSessionHandler(reqBody, sig) {
        const event = this.getEventObject(reqBody, sig, "whsec_45c66c4aa3d832710e36c5709bc10a2edf0b3da68b39a94447380921b6a0de7d");
        switch (event.type) {
            case "checkout.session.completed": {
                // code to create the server version of the subscription using the stripe subscription data
                console.log("Checkout Sucessfull");
                const { id, customer, subscription } = event.data.object;
                const checkoutSession = await objects_1.database.checkoutSession.findUnique({ where: { sessionId: id } });
                console.log(`SubscriptionId=${subscription}=CheckOutEvents`);
                if (checkoutSession && subscription) {
                    await objects_1.database.userSubscription.upsert({
                        where: { planId_userId: { planId: checkoutSession.planId, userId: checkoutSession.userId } },
                        create: { subId: subscription, stripeCustomerId: customer, planId: checkoutSession.planId, userId: checkoutSession.userId },
                        update: { subId: subscription, status: "pending" },
                    });
                    console.log("User Subscribed Successfully");
                }
                break;
            }
            case "checkout.session.expired": {
                console.log("Checkout Failed:Expierd");
                // send an message through web sockets
                break;
            }
            default: {
                console.log(`Unknown Event:${event.type}`);
            }
        }
        return { message: "Success" };
    }
    async invoiceEventsHandler(reqBody, sig) {
        const event = this.getEventObject(reqBody, sig, "whsec_45c66c4aa3d832710e36c5709bc10a2edf0b3da68b39a94447380921b6a0de7d");
        switch (event.type) {
            case "invoice.paid": {
                const { customer } = event.data.object;
                console.log(`Id of customer who was just billed=${customer}=Invoice Events`);
                await objects_1.database.userSubscription.update({ where: { stripeCustomerId: customer }, data: { status: "paid" } });
                // alert customer about the sucessfull subscription
                console.log(`Cusomer Has Subscribed`);
                break;
            }
            case "invoice.payment_action_required": {
                const { customer } = event.data.object;
                console.log(`Id of customer=${customer}`);
                const { userId } = await objects_1.database.userSubscription.update({ where: { stripeCustomerId: customer }, data: { status: "pending" } });
                // alert customer to confirm payment
                console.log(`Cusomer Payment Requires Confirmation 1`);
                break;
            }
            case "invoice.payment_failed": {
                const { customer, confirmation_secret } = event.data.object;
                console.log(`Id of customer =${customer}`);
                const { status, last_payment_error } = await this.paymentGateway.paymentIntents.retrieve(confirmation_secret.client_secret);
                const { userId } = (await objects_1.database.userSubscription.findUnique({ where: { stripeCustomerId: customer } }));
                if (status === "requires_action") {
                    // payment has 3d secure feature
                    if (last_payment_error) {
                        const { code } = last_payment_error;
                        if (code === "authentication_required") {
                            // alert customer to confirm payment
                            console.log(`Cusomer Payment Requires Confirmation 2`);
                        }
                    }
                }
                else if (status === "requires_payment_method") {
                    if (last_payment_error) {
                        const { code } = last_payment_error;
                        if (code === "card_declined") {
                            // alert customer to change payment method
                            console.log(`Cusomer Payment Needs To Be changed`);
                        }
                    }
                }
                break;
            }
            default:
                break;
        }
        return { message: "Success" };
    }
    async subscriptionEventsHandler(reqBody, sig) {
        const event = this.getEventObject(reqBody, sig, "whsec_45c66c4aa3d832710e36c5709bc10a2edf0b3da68b39a94447380921b6a0de7d");
        switch (event.type) {
            case "customer.subscription.deleted": {
                const { id } = event.data.object;
                await objects_1.database.userSubscription.update({ where: { subId: id }, data: { status: "cancelled" } });
                // alert customer that subscription has been successfully cancelled
                break;
            }
            default:
                break;
        }
        return { message: "Success" };
    }
    async alertUsersOfSubStatus(agrs) {
    }
}
exports.SubscriptionService = SubscriptionService;
