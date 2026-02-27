import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { checkBudget } from "@/lib/usage/guard";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET() {
  try {
    const context = await requireUserContext();

    // Rate limit: 30 requests per minute per user
    const rl = checkRateLimit(`usage:${context.userId}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const budget = await checkBudget(context.userId);

    // Omit raw token counts and costs — expose only budget summary
    const records = await prisma.usageRecord.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        operation: true,
        model: true,
        createdAt: true,
        episodeId: true,
      },
    });

    return NextResponse.json({
      usedCents: budget.usedCents,
      limitCents: budget.limitCents,
      remainingCents: budget.remainingCents,
      records,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 },
    );
  }
}
