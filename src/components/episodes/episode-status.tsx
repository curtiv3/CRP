"use client";

import { useEffect, useState } from "react";

interface EpisodeStatusProps {
  episodeId: string;
  initialStatus: string;
  isProcessing: boolean;
}

const STEPS = [
  { key: "UPLOADING", label: "Uploading" },
  { key: "TRANSCRIBING", label: "Transcribing" },
  { key: "ANALYZING", label: "Analyzing" },
  { key: "GENERATING", label: "Generating" },
  { key: "COMPLETE", label: "Complete" },
];

const STEP_ORDER: Record<string, number> = {};
STEPS.forEach((step, i) => {
  STEP_ORDER[step.key] = i;
});

export function EpisodeStatus({
  episodeId,
  initialStatus,
  isProcessing,
}: EpisodeStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [polling, setPolling] = useState(isProcessing);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/episodes/${episodeId}`);
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "COMPLETE" || data.status === "FAILED") {
          setPolling(false);
          window.location.reload();
        }
      } catch {
        // Polling errors are non-fatal
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [episodeId, polling]);

  if (status === "COMPLETE" || status === "FAILED") {
    return null;
  }

  const currentStep = STEP_ORDER[status] ?? 0;

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-4 w-4 rounded-full border-2 border-brand animate-spin border-t-transparent" />
        <p className="text-sm font-medium text-text-primary">
          Processing your episode...
        </p>
      </div>
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;

          return (
            <div key={step.key} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  isDone
                    ? "bg-brand"
                    : isActive
                      ? "bg-brand/50"
                      : "bg-bg-elevated"
                }`}
              />
              <p
                className={`mt-1.5 text-xs ${
                  isActive
                    ? "text-brand font-medium"
                    : isDone
                      ? "text-text-primary"
                      : "text-text-muted"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
