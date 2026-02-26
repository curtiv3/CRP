import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { EpisodeStatus } from "@/components/episodes/episode-status";
import { ContentDisplay } from "@/components/content/content-display";
import { DownloadButton } from "@/components/content/download-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episode = await prisma.episode.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: episode
      ? `${episode.title} — ContentRepurpose`
      : "Episode — ContentRepurpose",
  };
}

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireUserContext();
  const { id } = await params;

  const episode = await prisma.episode.findFirst({
    where: { id, userId: context.userId },
    include: {
      contentPieces: {
        orderBy: [{ platform: "asc" }, { order: "asc" }],
      },
    },
  });

  if (!episode) {
    notFound();
  }

  const isProcessing =
    episode.status === "UPLOADING" ||
    episode.status === "TRANSCRIBING" ||
    episode.status === "ANALYZING" ||
    episode.status === "GENERATING";

  const pieceCount = episode.contentPieces.length;
  const platformCount = new Set(episode.contentPieces.map((p) => p.platform)).size;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          &larr; Back to episodes
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {episode.title}
          </h1>
          {episode.description && (
            <p className="mt-1 text-sm text-text-secondary">
              {episode.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
            <span className="capitalize">
              {episode.sourceType.toLowerCase().replace("_", " ")}
            </span>
            {episode.duration && (
              <span>
                {Math.floor(episode.duration / 60)}:
                {(episode.duration % 60).toString().padStart(2, "0")}
              </span>
            )}
            <span>
              {new Date(episode.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {pieceCount > 0 && (
              <span className="font-mono">
                {pieceCount} pieces across {platformCount} platform
                {platformCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <EpisodeStatus
        episodeId={episode.id}
        initialStatus={episode.status}
        isProcessing={isProcessing}
      />

      {episode.status === "FAILED" && (
        <div className="rounded-lg border border-danger/20 bg-bg-surface p-4 mb-6">
          <p className="text-sm font-medium text-danger">Processing failed</p>
          {episode.errorMessage && (
            <p className="mt-1 text-xs text-text-secondary">
              {episode.errorMessage}
            </p>
          )}
        </div>
      )}

      {episode.contentPieces.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-text-primary">
              Generated Content
            </h2>
            <DownloadButton episodeId={episode.id} episodeTitle={episode.title} />
          </div>
          <ContentDisplay
            pieces={episode.contentPieces.map((p) => ({
              id: p.id,
              platform: p.platform,
              type: p.type,
              content: p.content,
              status: p.status,
              order: p.order,
            }))}
          />
        </div>
      )}

      {episode.transcription && (
        <details className="rounded-lg border border-border bg-bg-surface mb-6">
          <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-text-primary hover:bg-bg-elevated transition-colors">
            View Transcription
          </summary>
          <div className="px-6 pb-4">
            <div className="max-h-96 overflow-y-auto">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {episode.transcription}
              </p>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
