import { prisma } from "@/lib/prisma";

const TIER_LIMITS: Record<string, number> = {
  FREE: 100,
  PRO: 700,
  GROWTH: 2000,
};

export interface BudgetStatus {
  allowed: boolean;
  remainingCents: number;
  usedCents: number;
  limitCents: number;
}

/**
 * Check whether the user is within their monthly usage budget.
 * Auto-resets the counter if lastResetAt is from a previous month.
 */
export async function checkBudget(userId: string): Promise<BudgetStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const limitCents = TIER_LIMITS[user?.subscriptionTier ?? "FREE"] ?? 100;

  let budget = await prisma.usageBudget.findUnique({
    where: { userId },
  });

  if (!budget) {
    // First check — no budget row yet; user has full allowance
    return {
      allowed: true,
      remainingCents: limitCents,
      usedCents: 0,
      limitCents,
    };
  }

  // Auto-reset: if lastResetAt is not in the current calendar month, zero out
  const now = new Date();
  const lastReset = budget.lastResetAt;
  if (
    lastReset.getUTCFullYear() !== now.getUTCFullYear() ||
    lastReset.getUTCMonth() !== now.getUTCMonth()
  ) {
    budget = await prisma.usageBudget.update({
      where: { userId },
      data: {
        currentMonthUsageCents: 0,
        monthlyLimitCents: limitCents,
        lastResetAt: now,
      },
    });
  }

  // Sync limit in case the user's tier changed since the budget row was created
  if (budget.monthlyLimitCents !== limitCents) {
    budget = await prisma.usageBudget.update({
      where: { userId },
      data: { monthlyLimitCents: limitCents },
    });
  }

  const usedCents = budget.currentMonthUsageCents;
  const remainingCents = Math.max(0, limitCents - usedCents);

  return {
    allowed: usedCents < limitCents,
    remainingCents,
    usedCents,
    limitCents,
  };
}
