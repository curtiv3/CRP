import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { EpisodeStatus } from "@/components/episodes/episode-status";

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

      {episode.transcription && (
        <div className="rounded-lg border border-border bg-bg-surface p-6 mb-6">
          <h2 className="text-lg font-medium text-text-primary mb-3">
            Transcription
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {episode.transcription}
            </p>
          </div>
        </div>
      )}

      {episode.contentPieces.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-text-primary mb-4">
            Generated Content
          </h2>
          <div className="space-y-4">
            {episode.contentPieces.map((piece) => (
              <div
                key={piece.id}
                className="rounded-lg border border-border bg-bg-surface p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary uppercase">
                    {piece.platform} — {piece.type}
                  </span>
                  {piece.order > 0 && (
                    <span className="text-xs text-text-muted font-mono">
                      #{piece.order}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {piece.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
