import { NextResponse } from "next/server";
import { requireUserContext } from "@/lib/auth-context";
import { checkBudget } from "@/lib/usage/guard";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET() {
  try {
    const context = await requireUserContext();

    // Rate limit: 30 requests per minute per user
    const rl = checkRateLimit(`billing-status:${context.userId}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const budget = await checkBudget(context.userId);

    return NextResponse.json({
      tier: context.user.subscriptionTier,
      status: context.user.subscriptionStatus,
      hasStripeCustomer: !!context.user.stripeCustomerId,
      usage: {
        usedCents: budget.usedCents,
        limitCents: budget.limitCents,
        remainingCents: budget.remainingCents,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch billing status" },
      { status: 500 },
    );
  }
}
