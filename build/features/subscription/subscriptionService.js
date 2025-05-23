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
    async deleteSubscription(planId) {
        const planToDelete = await objects_1.database.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!planToDelete)
            throw new errorHandler_1.AppError("Deletion Failed,no such id exist", 404);
        await objects_1.database.subscriptionPlan.delete({ where: { id: planId } });
        await this.paymentGateway.prices.update(planToDelete.stripePriceId, { active: false });
        await this.paymentGateway.products.update(planToDelete.stripProductId, { active: false });
    }
    async getAllPlans(isAdmin = false) {
        // this method will be update to select the current plan for user
        if (isAdmin)
            return await objects_1.database.subscriptionPlan.findMany({});
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
    async subscribeToPlan(planId, userId) {
        let checkoutSession;
        const planDetails = await objects_1.database.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!planDetails)
            throw new errorHandler_1.AppError("No Subscription Plan with such id exist ", 404);
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
    async checkOutSessionHandler(reqBody, sig) {
        const webhookSecret = process.env.CHECKOUT_WEBHOOKSECRET ? process.env.CHECKOUT_WEBHOOKSECRET : "";
        const event = this.paymentGateway.webhooks.constructEvent(reqBody, sig, webhookSecret);
        switch (event.type) {
            case "checkout.session.completed": {
                // code to create the server version of the subscription using the stripe subscription data
                console.log("Checkout Sucessfull");
                const { id, customer, subscription } = event.data.object;
                const checkoutSession = await objects_1.database.checkoutSession.findUnique({ where: { sessionId: id } });
                console.log(`SubscriptionId=${subscription}`);
                if (checkoutSession && subscription) {
                    await objects_1.database.userSubscription.upsert({
                        where: { planId_userId: { planId: checkoutSession.planId, userId: checkoutSession.userId } },
                        create: { subId: subscription, stripeCustomerId: customer, planId: checkoutSession.planId, userId: checkoutSession.userId },
                        update: { subId: subscription, status: "paid" },
                    });
                    console.log("User Subscribed Successfully");
                }
                break;
            }
            case "checkout.session.expired": {
                console.log("Checkout Failed:Expierd");
                // code to handle checkout session failure
                break;
            }
            default: {
                console.log(`Unknown Event:${event.type}`);
            }
        }
        return { message: "Success" };
    }
}
exports.SubscriptionService = SubscriptionService;
