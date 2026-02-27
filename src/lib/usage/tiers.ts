import type { SubscriptionTier } from "@prisma/client";

/**
 * Monthly API cost budget per subscription tier (in cents).
 *
 * FREE:   $1.00 — ~2 episodes/month
 * PRO:    $7.00 — ~15-20 episodes/month
 * GROWTH: $20.00 — ~50+ episodes/month
 */
export const TIER_LIMIT_CENTS: Record<SubscriptionTier, number> = {
  FREE: 100,
  PRO: 700,
  GROWTH: 2000,
};

export function getLimitCentsForTier(tier: SubscriptionTier): number {
  return TIER_LIMIT_CENTS[tier];
}
