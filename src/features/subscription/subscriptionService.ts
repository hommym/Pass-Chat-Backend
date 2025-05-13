import { database } from "../../common/constants/objects";
import { AppError } from "../../common/middlewares/errorHandler";
import { CreateSubscriptionDto } from "./dto/createSubscriptionDto";
import { Stripe } from "stripe";

export class SubscriptionService {
  private paymentGateway: Stripe;

  constructor(paymentSecret: string | undefined) {
    this.paymentGateway = new Stripe(paymentSecret!);
  }

  async createSubscription(subDto: CreateSubscriptionDto) {
    // this methods create a subcription plan if the plan does not exist and updates it if it exist
    const { name, price, benefit, description, interval } = subDto;

    // save subscription data in db(upsert)
    let subPlan = await database.subscriptionPlan.findUnique({ where: { name_interval: { name, interval } } });

    if (subPlan) throw new AppError(`Subscription Plan Already exist`, 409);
    subPlan = await database.subscriptionPlan.create({ data: { name, description, price, interval, benefit: JSON.parse(JSON.stringify(benefit)) } });

    const stripeProduct = await this.paymentGateway.products.create({ name, description });
    const stripePrice = await this.paymentGateway.prices.create({ currency: "usd", unit_amount: price, recurring: { interval }, product: stripeProduct.id });

    await database.subscriptionPlan.update({ where: { id: subPlan.id }, data: { stripProductId: stripeProduct.id, stripePriceId: stripePrice.id } });

    return { message: "Subscription Created Successfully" };
  }

  async deleteSubscription(planId: number) {
    const planToDelete = await database.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!planToDelete) throw new AppError("Deletion Failed,no such id exist", 404);
    await database.subscriptionPlan.delete({ where: { id: planId } });

    await this.paymentGateway.prices.update(planToDelete.stripePriceId!, { active: false });
    await this.paymentGateway.products.update(planToDelete.stripProductId!, { active: false });
  }

  async getAllPlans() {
    // this method will be update to select the current plan for user
    return await database.subscriptionPlan.findMany({});
  }
}
