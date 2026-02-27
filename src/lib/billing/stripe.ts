import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";
import { getLimitCentsForTier } from "@/lib/usage/tiers";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  GROWTH: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
};

/**
 * Create a Stripe Checkout Session for upgrading to PRO or GROWTH.
 * Returns the checkout URL the frontend should redirect to.
 */
export async function createCheckoutSession(
  userId: string,
  tier: "PRO" | "GROWTH",
): Promise<string> {
  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for tier: ${tier}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.AUTH_URL}/dashboard?billing=success`,
    cancel_url: `${process.env.AUTH_URL}/dashboard?billing=canceled`,
    metadata: { userId, tier },
  };

  if (user.stripeCustomerId) {
    sessionParams.customer = user.stripeCustomerId;
  } else {
    sessionParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return session.url;
}

/**
 * Create a Stripe Customer Portal session so the user can manage
 * their subscription (change plan, update payment method, cancel).
 */
export async function createPortalSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("No Stripe customer found for this user");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.AUTH_URL}/dashboard`,
  });

  return session.url;
}

/**
 * Map a Stripe Price ID back to our SubscriptionTier enum.
 */
export function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === PRICE_IDS.GROWTH) return "GROWTH";
  if (priceId === PRICE_IDS.PRO) return "PRO";
  return "FREE";
}

/**
 * After a tier change, sync the UsageBudget.monthlyLimitCents so the
 * new limit takes effect immediately (not just on next checkBudget call).
 */
export async function syncBudgetLimit(
  userId: string,
  tier: SubscriptionTier,
): Promise<void> {
  const limitCents = getLimitCentsForTier(tier);

  await prisma.usageBudget.upsert({
    where: { userId },
    create: {
      userId,
      monthlyLimitCents: limitCents,
      currentMonthUsageCents: 0,
      lastResetAt: new Date(),
    },
    update: {
      monthlyLimitCents: limitCents,
    },
  });
}
