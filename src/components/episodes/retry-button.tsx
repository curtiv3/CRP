"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RetryButtonProps {
  episodeId: string;
}

export function RetryButton({ episodeId }: RetryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/reprocess`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to reprocess");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleRetry}
        disabled={loading}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? "Retrying..." : "Retry Processing"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
