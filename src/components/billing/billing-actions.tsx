"use client";

import { useState } from "react";

interface BillingActionsProps {
  tier: string;
  hasStripeCustomer: boolean;
}

export function BillingActions({ tier, hasStripeCustomer }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (selectedTier: "PRO" | "GROWTH") => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to open billing portal");
      }

      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div>
      {tier === "FREE" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCheckout("PRO")}
            disabled={loading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "Loading..." : "Upgrade to Pro"}
          </button>
        </div>
      )}

      {(tier === "PRO" || tier === "GROWTH") && hasStripeCustomer && (
        <button
          onClick={handlePortal}
          disabled={loading}
          className="rounded-lg border border-border bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated disabled:opacity-50"
        >
          {loading ? "Loading..." : "Manage Subscription"}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
