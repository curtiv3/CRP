import { prisma } from "@/lib/prisma";

const HOURLY_LIMIT_CENTS = parseInt(
  process.env.GLOBAL_HOURLY_COST_LIMIT_CENTS ?? "500",
  10,
);
const DAILY_LIMIT_CENTS = parseInt(
  process.env.GLOBAL_DAILY_COST_LIMIT_CENTS ?? "5000",
  10,
);

export interface GlobalLimitStatus {
  allowed: boolean;
  reason: string | null;
  hourlyCostCents: number;
  dailyCostCents: number;
}

/**
 * Global circuit breaker — sums ALL UsageRecords across ALL users for
 * the last hour and last 24 hours. If either limit is exceeded, every
 * new processing job is blocked regardless of individual user budgets.
 *
 * This is the last line of defence: even if there's a bug in per-user
 * budget checks, total API spend cannot exceed the configured caps.
 */
export async function checkGlobalLimits(): Promise<GlobalLimitStatus> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Run both aggregations in parallel
  const [hourlyAgg, dailyAgg] = await Promise.all([
    prisma.usageRecord.aggregate({
      _sum: { cost: true },
      where: { createdAt: { gte: oneHourAgo } },
    }),
    prisma.usageRecord.aggregate({
      _sum: { cost: true },
      where: { createdAt: { gte: oneDayAgo } },
    }),
  ]);

  const hourlyCost = hourlyAgg._sum.cost ?? 0;
  const dailyCost = dailyAgg._sum.cost ?? 0;
  const hourlyCostCents = Math.ceil(hourlyCost * 100);
  const dailyCostCents = Math.ceil(dailyCost * 100);

  if (hourlyCostCents >= HOURLY_LIMIT_CENTS) {
    console.warn(
      `[CIRCUIT BREAKER] Hourly cost limit reached: ${hourlyCostCents}c / ${HOURLY_LIMIT_CENTS}c`,
    );
    return {
      allowed: false,
      reason: "hourly",
      hourlyCostCents,
      dailyCostCents,
    };
  }

  if (dailyCostCents >= DAILY_LIMIT_CENTS) {
    console.warn(
      `[CIRCUIT BREAKER] Daily cost limit reached: ${dailyCostCents}c / ${DAILY_LIMIT_CENTS}c`,
    );
    return {
      allowed: false,
      reason: "daily",
      hourlyCostCents,
      dailyCostCents,
    };
  }

  return {
    allowed: true,
    reason: null,
    hourlyCostCents,
    dailyCostCents,
  };
}
