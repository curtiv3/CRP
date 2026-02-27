import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checkBudget } from "@/lib/usage/guard";

interface UsageBarProps {
  userId: string;
}

export async function UsageBar({ userId }: UsageBarProps) {
  const budget = await checkBudget(userId);

  // Calculate average cost per episode from completed episodes' usage records
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

  // Color thresholds
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
                  {" "}
                  &middot; ~{estimatedRemaining} remaining
                </span>
              )}
              {estimatedRemaining === 0 && usagePercent >= 90 && (
                <span className="font-normal text-danger">
                  {" "}
                  &middot; limit reached
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
