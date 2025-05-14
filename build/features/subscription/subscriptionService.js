"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
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
    async getAllPlans() {
        // this method will be update to select the current plan for user
        return await objects_1.database.subscriptionPlan.findMany({});
    }
}
exports.SubscriptionService = SubscriptionService;
