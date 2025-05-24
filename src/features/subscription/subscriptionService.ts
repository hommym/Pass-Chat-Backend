import dotenv from "dotenv";
dotenv.config();
import { database } from "../../common/constants/objects";
import { AppError } from "../../common/middlewares/errorHandler";
import { CreateSubscriptionDto } from "./dto/createSubscriptionDto";
import { Stripe } from "stripe";

export class SubscriptionService {
  private paymentGateway: Stripe;
  private webhookSecret = process.env.CHECKOUT_WEBHOOKSECRET ? process.env.CHECKOUT_WEBHOOKSECRET : "";
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
    const planToDelete = await this.checkPlan(planId);
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

  private async checkPlan(planId: number) {
    const planDetails = await database.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!planDetails) throw new AppError("No Subscription Plan with such id exist ", 404);
    return planDetails;
  }

  async subscribeToPlan(planId: number, userId: number) {
    let checkoutSession: Stripe.Response<Stripe.Checkout.Session>;
    const planDetails = await this.checkPlan(planId);

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

  async cancelSubscriptionPlan(userId: number, type: "later" | "now") {
    const activeSubs = await database.userSubscription.findMany({ where: { userId, status: { in: ["paid", "unPaid"] } } });

    if (activeSubs.length === 0) throw new AppError("User not on any plan", 404);

    const { subId } = activeSubs[0];

    if (type === "later") await this.paymentGateway.subscriptions.update(subId, { cancel_at_period_end: true });
    else this, this.paymentGateway.subscriptions.cancel(subId);

    // update users account using the webhook event under subscriptions
    return { message: "Subscription Cancelled Successfully" };
  }

  async changeSubscriptionPlan(planId: number, userId: number) {
    const planDetails = await this.checkPlan(planId);

    const activeSub = await database.userSubscription.findUnique({ where: { planId_userId: { planId, userId }, status: { in: ["paid", "unPaid"] } } });

    if (!activeSub) throw new AppError("User not on any plan with this id", 404);

    const subscriptionDetails = await this.paymentGateway.subscriptions.retrieve(activeSub.subId);
    const subItem = subscriptionDetails.items.data[0];

    await this.paymentGateway.subscriptions.update(activeSub.subId, { items: [{ id: subItem.id, price: planDetails.stripePriceId! }] });

    await database.userSubscription.update({ where: { subId: activeSub.subId }, data: { status: "pending" } });
    return { message: "Subscription plan update was successfull, awaiting payment" };
  }

  private getEventObject(reqBody: any, sig: string | string[]) {
    return this.paymentGateway.webhooks.constructEvent(reqBody, sig, this.webhookSecret);
  }

  async checkOutSessionHandler(reqBody: any, sig: string | string[]) {
    const event: Stripe.Event = this.getEventObject(reqBody, sig);

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
            update: { subId: subscription! as string, status: "pending" },
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

  async invoiceEventsHandler(reqBody: any, sig: string | string[]) {
    const event = this.getEventObject(reqBody, sig);

    switch (event.type) {
      case "invoice.paid": {
        const { customer } = event.data.object;
        console.log(`Id of customer who was just billed=${customer}`);
        await database.userSubscription.update({ where: { stripeCustomerId: customer as string }, data: { status: "paid" } });
        // send user notification through websockets
        break;
      }
      case "invoice.payment_action_required": {
        const { customer } = event.data.object;
        console.log(`Id of customer=${customer}`);
        await database.userSubscription.update({ where: { stripeCustomerId: customer as string }, data: { status: "pending" } });
        // notify user to confirm to confirm the payment with issuer before subscription will be active
        break;
      }

      case "invoice.payment_failed": {
        const { customer } = event.data.object;
        console.log(`Id of customer =${customer}`);
        // add code to handle this if the event is as a result of first payment requiring user action (eg 3d secure)
        // notify user that payment failed so they should either top up or change payment method .

        break;
      }
      default:
        break;
    }

    return { message: "Success" };
  }

  async subscrptionEventsHandler(reqBody: any, sig: string | string[]) {
    const event = this.getEventObject(reqBody, sig);

    switch (event.type) {
      case "customer.subscription.deleted": {
        const { id } = event.data.object;
        await database.userSubscription.update({ where: { subId: id }, data: { status: "cancelled" } });
        // send notification to user through websockets
        break;
      }

      default:
        break;
    }

    return { message: "Success" };
  }

  // async paymentIntentEventsHandler(reqBody: any, sig: string | string[]) {
  //   const event = this.getEventObject(reqBody, sig);
  // }
}
