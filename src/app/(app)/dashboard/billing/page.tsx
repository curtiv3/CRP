import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { checkBudget } from "@/lib/usage/guard";
import { BillingActions } from "@/components/billing/billing-actions";

export const metadata = {
  title: "Billing — ContentRepurpose",
};

export default async function BillingPage() {
  const context = await requireUserContext();
  const budget = await checkBudget(context.userId);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const episodesThisMonth = await prisma.episode.count({
    where: {
      userId: context.userId,
      createdAt: { gte: startOfMonth },
    },
  });

  const tier = context.user.subscriptionTier;
  const hasStripeCustomer = !!context.user.stripeCustomerId;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Billing</h1>

      <div className="rounded-lg border border-border bg-bg-surface p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-text-secondary">Current plan</p>
            <p className="text-lg font-semibold text-text-primary">
              {tier === "FREE" ? "Free" : tier === "PRO" ? "Pro — $19/mo" : "Growth — $39/mo"}
            </p>
          </div>
          <BillingActions tier={tier} hasStripeCustomer={hasStripeCustomer} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-6">
        <h2 className="text-sm font-medium text-text-secondary mb-4">Usage this month</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-2xl font-semibold text-text-primary font-mono">
              {episodesThisMonth}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {tier === "FREE" ? "of 2 episodes" : "episodes processed"}
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-text-primary font-mono">
              {budget.usedCents}¢
            </p>
            <p className="text-xs text-text-secondary mt-1">
              of {budget.limitCents}¢ API budget
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
