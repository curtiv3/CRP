import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { EpisodeList } from "@/components/episodes/episode-list";
import { UsageBar } from "@/components/usage/usage-bar";

export const metadata = {
  title: "Dashboard — ContentRepurpose",
};

export default async function DashboardPage() {
  const context = await requireUserContext();

  const episodes = await prisma.episode.findMany({
    where: { userId: context.userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { contentPieces: true } },
    },
  });

  const totalEpisodes = episodes.length;
  const totalPieces = episodes.reduce(
    (sum, ep) => sum + ep._count.contentPieces,
    0,
  );
  const completedCount = episodes.filter(
    (ep) => ep.status === "COMPLETE",
  ).length;

  return (
    <div>
      <UsageBar userId={context.userId} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Your Episodes
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {totalEpisodes} episodes processed, {totalPieces} content pieces
            generated
          </p>
        </div>
        <Link
          href="/dashboard/episodes/new"
          className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
        >
          Upload Episode
        </Link>
      </div>

      {episodes.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg-surface p-12 text-center">
          <h2 className="text-lg font-medium text-text-primary">
            No episodes yet
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Upload your first episode to get started. We'll transcribe it and
            generate content for you.
          </p>
          <Link
            href="/dashboard/episodes/new"
            className="mt-4 inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover"
          >
            Upload your first episode
          </Link>
        </div>
      ) : (
        <EpisodeList
          episodes={episodes.map((ep) => ({
            id: ep.id,
            title: ep.title,
            status: ep.status,
            sourceType: ep.sourceType,
            duration: ep.duration,
            contentPieceCount: ep._count.contentPieces,
            createdAt: ep.createdAt.toISOString(),
            processedAt: ep.processedAt?.toISOString() ?? null,
          }))}
          completedCount={completedCount}
        />
      )}
    </div>
  );
}
