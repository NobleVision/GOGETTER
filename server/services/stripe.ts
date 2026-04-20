import Stripe from "stripe";
import { ENV } from "../_core/env";
import * as db from "../db";
import { SUBSCRIPTION_TIERS, type SubscriptionTierKey } from "@shared/const";

let stripeClient: Stripe | null = null;

export type BillingPlanKey = Extract<
  SubscriptionTierKey,
  "launch_pass" | "starter" | "pro"
>;

export function stripeConfigured(): boolean {
  return Boolean(ENV.stripeSecretKey && ENV.stripePublishableKey);
}

export function getStripeClient(): Stripe {
  if (!ENV.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY must be configured before using billing features");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });
  }

  return stripeClient;
}

function cents(amountUsd: number): number {
  return Math.round(amountUsd * 100);
}

export function getBillingPlanConfig(plan: BillingPlanKey) {
  const tier = SUBSCRIPTION_TIERS[plan];
  const recurring = plan !== "launch_pass";

  const configuredPriceId =
    plan === "launch_pass"
      ? ENV.stripeLaunchPassPriceId
      : plan === "starter"
        ? ENV.stripeStarterPriceId
        : ENV.stripeProPriceId;

  return {
    key: plan,
    name: tier.name,
    description: tier.description,
    credits: tier.monthlyCredits,
    amount: cents(tier.price),
    recurring,
    configuredPriceId,
    metadata: {
      plan,
      credits: String(tier.monthlyCredits),
      activeBusinesses: String(tier.activeBusinesses),
    },
  };
}

async function ensureStripeCustomer(userId: number) {
  const user = await db.getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const subscription = await db.getOrCreateSubscription(userId);
  const stripe = getStripeClient();

  if (subscription.stripeCustomerId) {
    return {
      user,
      subscription,
      customerId: subscription.stripeCustomerId,
    };
  }

  if (user.stripeCustomerId) {
    await db.updateSubscription(userId, subscription.tier as SubscriptionTierKey, {
      stripeCustomerId: user.stripeCustomerId,
      resetCredits: false,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });

    return {
      user,
      subscription: await db.getOrCreateSubscription(userId),
      customerId: user.stripeCustomerId,
    };
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: {
      userId: String(user.id),
      openId: user.openId,
    },
  });

  await db.updateSubscription(userId, subscription.tier as SubscriptionTierKey, {
    stripeCustomerId: customer.id,
    resetCredits: false,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });

  return {
    user,
    subscription: await db.getOrCreateSubscription(userId),
    customerId: customer.id,
  };
}

function buildInlinePriceData(plan: BillingPlanKey): Stripe.Checkout.SessionCreateParams.LineItem {
  const config = getBillingPlanConfig(plan);
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: config.amount,
      recurring: config.recurring ? { interval: "month" } : undefined,
      product_data: {
        name: `GoGetterOS ${config.name}`,
        description: config.description,
      },
    },
  };
}

export async function createCheckoutSession(input: {
  userId: number;
  plan: BillingPlanKey;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const { user, customerId } = await ensureStripeCustomer(input.userId);
  const plan = getBillingPlanConfig(input.plan);

  const session = await stripe.checkout.sessions.create({
    mode: plan.recurring ? "subscription" : "payment",
    customer: customerId,
    client_reference_id: String(input.userId),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: true,
    customer_update: {
      address: "auto",
      name: "auto",
    },
    line_items: [
      plan.configuredPriceId
        ? { price: plan.configuredPriceId, quantity: 1 }
        : buildInlinePriceData(input.plan),
    ],
    metadata: {
      userId: String(input.userId),
      email: user.email ?? "",
      plan: input.plan,
      credits: String(plan.credits),
    },
  });

  await db.updateSubscription(input.userId, input.plan, {
    stripeCustomerId: customerId,
    stripeCheckoutSessionId: session.id,
    resetCredits: false,
    status: "checkout_pending",
  });

  return {
    id: session.id,
    url: session.url,
    publishableKey: ENV.stripePublishableKey,
  };
}

export async function createBillingPortalSession(input: {
  userId: number;
  returnUrl: string;
}) {
  const stripe = getStripeClient();
  const { customerId } = await ensureStripeCustomer(input.userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: input.returnUrl,
  });

  return {
    url: session.url,
  };
}

export async function createCreditTopUpSession(input: {
  userId: number;
  amountUsd: number;
  credits: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const { user, customerId } = await ensureStripeCustomer(input.userId);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: String(input.userId),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: true,
    line_items: [
      ENV.stripeCreditsTopupPriceId
        ? { price: ENV.stripeCreditsTopupPriceId, quantity: Math.max(1, creditsToQuantity(input.credits)) }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: cents(input.amountUsd),
              product_data: {
                name: `GoGetterOS Credit Top-Up (${input.credits} credits)`,
                description: "Additional credits for premium actions, prompts, and hosted workflows.",
              },
            },
          },
    ],
    metadata: {
      userId: String(input.userId),
      email: user.email ?? "",
      topUpCredits: String(input.credits),
      amountUsd: String(input.amountUsd),
      plan: "credits",
    },
  });

  return {
    id: session.id,
    url: session.url,
    publishableKey: ENV.stripePublishableKey,
  };
}

function creditsToQuantity(credits: number): number {
  return Math.max(1, Math.round(credits / 100));
}

export function constructStripeEvent(payload: Buffer | string, signature: string) {
  if (!ENV.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be configured before verifying webhook payloads");
  }

  return getStripeClient().webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret,
  );
}

export async function syncSubscriptionFromStripe(params: {
  userId: number;
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
  tier: SubscriptionTierKey;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  resetCredits?: boolean;
}) {
  return db.updateSubscription(params.userId, params.tier, {
    stripeCustomerId: params.customerId,
    stripeSubscriptionId: params.subscriptionId,
    stripePriceId: params.priceId,
    status: params.status,
    currentPeriodStart: params.currentPeriodStart,
    currentPeriodEnd: params.currentPeriodEnd,
    resetCredits: params.resetCredits,
  });
}

export async function applyCreditsFromCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = Number(session.metadata?.userId ?? session.client_reference_id ?? 0);
  if (!userId) {
    throw new Error("Unable to determine userId from Stripe checkout session metadata");
  }

  const topUpCredits = Number(session.metadata?.topUpCredits ?? 0);
  if (topUpCredits <= 0) {
    return { userId, applied: 0 };
  }

  await db.applyCreditDelta({
    userId,
    amount: topUpCredits,
    reason: "stripe_top_up",
    description: `Stripe top-up for ${topUpCredits} credits`,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    metadata: {
      sessionId: session.id,
    },
  });

  return { userId, applied: topUpCredits };
}
