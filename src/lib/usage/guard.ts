import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLimitCentsForTier } from "@/lib/usage/tiers";

export interface BudgetStatus {
  allowed: boolean;
  remainingCents: number;
  usedCents: number;
  limitCents: number;
}

/**
 * Check whether the user is within their monthly usage budget.
 * Auto-creates the UsageBudget row if none exists.
 * Auto-resets the counter if lastResetAt is from a previous month.
 */
export async function checkBudget(userId: string): Promise<BudgetStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const limitCents = getLimitCentsForTier(user?.subscriptionTier ?? "FREE");

  let budget = await prisma.usageBudget.findUnique({
    where: { userId },
  });

  if (!budget) {
    // Auto-create budget row so it exists for subsequent trackUsage calls.
    // Two concurrent requests may both reach this branch — catch P2002
    // (unique constraint) and fall back to a read if another caller won.
    try {
      budget = await prisma.usageBudget.create({
        data: {
          userId,
          monthlyLimitCents: limitCents,
          currentMonthUsageCents: 0,
          lastResetAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        budget = await prisma.usageBudget.findUnique({ where: { userId } });
        if (!budget) {
          throw new Error("UsageBudget row missing after P2002 conflict");
        }
      } else {
        throw error;
      }
    }
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
