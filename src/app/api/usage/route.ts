import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { checkBudget } from "@/lib/usage/guard";

export async function GET() {
  try {
    const context = await requireUserContext();

    const budget = await checkBudget(context.userId);

    const records = await prisma.usageRecord.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        operation: true,
        inputTokens: true,
        outputTokens: true,
        cost: true,
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
