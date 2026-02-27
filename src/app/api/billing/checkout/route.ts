import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserContext } from "@/lib/auth-context";
import { createCheckoutSession, createPortalSession } from "@/lib/billing/stripe";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  tier: z.enum(["PRO", "GROWTH"]),
});

const actionSchema = z.object({
  action: z.literal("portal"),
});

export async function POST(request: Request) {
  try {
    const context = await requireUserContext();

    // Rate limit: 5 checkout/portal sessions per hour per user
    const rl = checkRateLimit(`billing:${context.userId}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    // If the user wants to manage their existing subscription, open the portal
    const portalParse = actionSchema.safeParse(body);
    if (portalParse.success) {
      const url = await createPortalSession(context.userId);
      return NextResponse.json({ url });
    }

    // Otherwise, create a new checkout session for the requested tier
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid tier. Must be PRO or GROWTH." },
        { status: 400 },
      );
    }

    const url = await createCheckoutSession(context.userId, result.data.tier);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      error.message === "No Stripe customer found for this user"
    ) {
      return NextResponse.json(
        { error: "No active subscription to manage" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create billing session" },
      { status: 500 },
    );
  }
}
