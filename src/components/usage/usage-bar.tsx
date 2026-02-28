import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checkBudget } from "@/lib/usage/guard";

interface UsageBarProps {
  userId: string;
}

const FREE_TIER_MONTHLY_LIMIT = 2;

export async function UsageBar({ userId }: UsageBarProps) {
  const budget = await checkBudget(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = user?.subscriptionTier ?? "FREE";

  // Free tier: show episode count (X of 2)
  if (tier === "FREE") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const episodesThisMonth = await prisma.episode.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    const episodePercent = Math.min(
      100,
      Math.round((episodesThisMonth / FREE_TIER_MONTHLY_LIMIT) * 100),
    );
    const limitReached = episodesThisMonth >= FREE_TIER_MONTHLY_LIMIT;

    return (
      <div className="rounded-lg border border-border bg-bg-surface px-4 py-3 mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-text-primary">
            {episodesThisMonth} of {FREE_TIER_MONTHLY_LIMIT} episodes this month
            {limitReached && (
              <span className="font-normal text-danger">
                {" "}&middot; Free limit reached
              </span>
            )}
          </p>
          <Link
            href="/dashboard/billing"
            className="text-xs font-medium text-brand hover:text-brand-hover"
          >
            {limitReached
              ? "Upgrade to Pro for unlimited episodes"
              : "Upgrade"}
          </Link>
        </div>

        <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${limitReached ? "bg-danger" : "bg-brand"}`}
            style={{ width: `${episodePercent}%` }}
          />
        </div>
      </div>
    );
  }

  // PRO / GROWTH tiers: show API budget
  const completedEpisodeIds = await prisma.episode.findMany({
    where: { userId, status: "COMPLETE" },
    select: { id: true },
  });

  let avgCostCentsPerEpisode = 0;
  let estimatedRemaining = 0;
  const completedCount = completedEpisodeIds.length;

  if (completedCount > 0) {
    const totalCostAgg = await prisma.usageRecord.aggregate({
      _sum: { cost: true },
      where: {
        userId,
        episodeId: { in: completedEpisodeIds.map((e) => e.id) },
      },
    });

    const totalCostCents = Math.ceil((totalCostAgg._sum.cost ?? 0) * 100);
    avgCostCentsPerEpisode = Math.ceil(totalCostCents / completedCount);

    if (avgCostCentsPerEpisode > 0) {
      estimatedRemaining = Math.floor(
        budget.remainingCents / avgCostCentsPerEpisode,
      );
    }
  }

  const usagePercent =
    budget.limitCents > 0
      ? Math.min(100, Math.round((budget.usedCents / budget.limitCents) * 100))
      : 0;

  let barColor = "bg-brand";
  let textColor = "text-text-secondary";
  if (usagePercent >= 90) {
    barColor = "bg-danger";
    textColor = "text-danger";
  } else if (usagePercent >= 75) {
    barColor = "bg-warning";
    textColor = "text-warning";
  }

  const hasUsageData = avgCostCentsPerEpisode > 0;

  return (
    <div className="rounded-lg border border-border bg-bg-surface px-4 py-3 mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-text-primary">
          {hasUsageData ? (
            <>
              ~{completedCount} episodes this month
              {estimatedRemaining > 0 && (
                <span className="font-normal text-text-secondary">
                  {" "}&middot; ~{estimatedRemaining} remaining
                </span>
              )}
              {estimatedRemaining === 0 && usagePercent >= 90 && (
                <span className="font-normal text-danger">
                  {" "}&middot; limit reached
                </span>
              )}
            </>
          ) : (
            <span className="text-text-secondary">
              No episodes processed yet
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${textColor}`}>{usagePercent}% used</span>
          {usagePercent >= 75 && (
            <Link
              href="/dashboard/billing"
              className="text-xs font-medium text-brand hover:text-brand-hover"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
    </div>
  );
}
