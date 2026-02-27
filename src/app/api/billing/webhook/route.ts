import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierFromPriceId, syncBudgetLimit } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
  }
  return secret;
}

const VALID_TIERS: ReadonlySet<string> = new Set<string>(["FREE", "PRO", "GROWTH"]);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier || !VALID_TIERS.has(tier)) {
    console.warn("[BILLING] checkout.session.completed missing or invalid metadata", {
      sessionId: session.id,
      userId,
      tier,
    });
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier as SubscriptionTier,
      subscriptionStatus: "ACTIVE",
      stripeCustomerId: customerId ?? undefined,
    },
  });

  await syncBudgetLimit(userId, tier as SubscriptionTier);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    console.warn("[BILLING] subscription.updated for unknown customer", {
      customerId,
    });
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    return;
  }

  const newTier = tierFromPriceId(priceId);

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionTier: newTier, subscriptionStatus: "ACTIVE" },
  });

  await syncBudgetLimit(user.id, newTier);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    console.warn("[BILLING] subscription.deleted for unknown customer", {
      customerId,
    });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionTier: "FREE", subscriptionStatus: "CANCELED" },
  });

  await syncBudgetLimit(user.id, "FREE");
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) {
    return;
  }

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    console.warn("[BILLING] invoice.payment_failed for unknown customer", {
      customerId,
    });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });
}
