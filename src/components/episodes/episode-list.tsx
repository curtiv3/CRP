"use client";

import Link from "next/link";

interface EpisodeItem {
  id: string;
  title: string;
  status: string;
  sourceType: string;
  duration: number | null;
  contentPieceCount: number;
  createdAt: string;
  processedAt: string | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  UPLOADING: { label: "Uploading", className: "text-text-muted" },
  TRANSCRIBING: { label: "Transcribing", className: "text-info" },
  ANALYZING: { label: "Analyzing", className: "text-info" },
  GENERATING: { label: "Generating", className: "text-warning" },
  COMPLETE: { label: "Complete", className: "text-success" },
  FAILED: { label: "Failed", className: "text-danger" },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EpisodeList({
  episodes,
}: {
  episodes: EpisodeItem[];
  completedCount: number;
}) {
  return (
    <div className="space-y-3">
      {episodes.map((episode) => {
        const statusInfo = STATUS_LABELS[episode.status] ?? {
          label: episode.status,
          className: "text-text-muted",
        };

        return (
          <Link
            key={episode.id}
            href={`/dashboard/episodes/${episode.id}`}
            className="block rounded-lg border border-border bg-bg-surface p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-text-primary">
                  {episode.title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                  <span>{formatDate(episode.createdAt)}</span>
                  {episode.duration && (
                    <span>{formatDuration(episode.duration)}</span>
                  )}
                  <span className="capitalize">
                    {episode.sourceType.toLowerCase().replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {episode.contentPieceCount > 0 && (
                  <span className="text-xs text-text-secondary font-mono">
                    {episode.contentPieceCount} pieces
                  </span>
                )}
                <span className={`text-xs font-medium ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
