import dotenv from "dotenv";
dotenv.config();
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

  async getAllPlans(isAdmin: boolean = false) {
    // this method will be update to select the current plan for user

    if (isAdmin) return await database.subscriptionPlan.findMany({});
  }

  private async checkPrevOrActiveSubs(userId: number, planId: number) {
    // this methods checks user's sub history and returns any prev subs on the plan been subscribed to
    //else throws an error if user is already on active subscrition

    const activeSubs = await database.userSubscription.findMany({ where: { userId, status: { in: ["paid", "unPaid"] } } });

    if (activeSubs.length > 0) throw new AppError("User Already Has An Active Subscription Plan", 409);

    const prevSubs = await database.userSubscription.findMany({ where: { userId }, include: { user: true, subPlan: true } });
    return prevSubs.length > 0 ? prevSubs[0] : null;
  }

  async subscribeToPlan(planId: number, userId: number) {
    let checkoutSession: Stripe.Response<Stripe.Checkout.Session>;
    const planDetails = await database.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!planDetails) throw new AppError("No Subscription Plan with such id exist ", 404);

    const hasUserSubBefore = await this.checkPrevOrActiveSubs(userId, planId);
    const returnUrl = process.env.SUCCESSFULL_PAYMENT_URL ? process.env.SUCCESSFULL_PAYMENT_URL : "https://call3.paschat.net";
    if (hasUserSubBefore) {
      const { stripeCustomerId } = hasUserSubBefore;

      checkoutSession = await this.paymentGateway.checkout.sessions.create({
        success_url: returnUrl,
        customer: stripeCustomerId,
        line_items: [{ price: planDetails.stripePriceId!, quantity: 1 }],
        mode: "subscription",
        payment_method_types: ["card"],
      });
    } else {
      checkoutSession = await this.paymentGateway.checkout.sessions.create({
        success_url: returnUrl,
        line_items: [{ price: planDetails.stripePriceId!, quantity: 1 }],
        mode: "subscription",
        payment_method_types: ["card"],
      });
    }

    await database.checkoutSession.create({ data: { sessionId: checkoutSession.id, planId, userId } });

    return { checkoutPage: checkoutSession.url };
  }

  async cancelSubscriptionPlan(userId: number) {
    const activeSubs = await database.userSubscription.findMany({ where: { userId, status: { in: ["paid", "unPaid"] } } });

    if (activeSubs.length === 0) throw new AppError("User not on any plan", 404);

    const { subId } = activeSubs[0];

    await this.paymentGateway.subscriptions.update(subId, { cancel_at_period_end: true });

    return { message: "Subscription Cancelled Successfully" };
  }

  async checkOutSessionHandler(reqBody: any, sig: string | string[]) {
    const webhookSecret = process.env.CHECKOUT_WEBHOOKSECRET ? process.env.CHECKOUT_WEBHOOKSECRET : "";
    const event: Stripe.Event = this.paymentGateway.webhooks.constructEvent(reqBody, sig, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        // code to create the server version of the subscription using the stripe subscription data
        console.log("Checkout Sucessfull");
        const { id, customer, subscription } = event.data.object;
        const checkoutSession = await database.checkoutSession.findUnique({ where: { sessionId: id } });
        console.log(`SubscriptionId=${subscription}`);
        if (checkoutSession && subscription) {
          await database.userSubscription.upsert({
            where: { planId_userId: { planId: checkoutSession.planId, userId: checkoutSession.userId } },
            create: { subId: subscription! as string, stripeCustomerId: customer! as string, planId: checkoutSession.planId, userId: checkoutSession.userId },
            update: { subId: subscription! as string, status: "paid" },
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
