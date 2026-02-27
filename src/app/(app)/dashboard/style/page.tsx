import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { StyleProfileEditor } from "@/components/style/style-profile-editor";

export const metadata: Metadata = {
  title: "Style Profile",
};

export default async function StyleProfilePage() {
  const context = await requireUserContext();

  const profile = await prisma.styleProfile.findUnique({
    where: { userId: context.userId },
  });

  const episodeCount = await prisma.episode.count({
    where: { userId: context.userId, status: "COMPLETE" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          Style Profile
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your writing style preferences. These are applied to all generated
          content so it sounds like you.
        </p>
      </div>

      {!profile && episodeCount < 3 && (
        <div className="rounded-lg border border-border bg-bg-surface p-6 mb-6">
          <h2 className="text-sm font-medium text-text-primary mb-2">
            Building your style profile
          </h2>
          <p className="text-sm text-text-secondary mb-3">
            Process at least 3 episodes and edit some of the generated content.
            We&apos;ll analyze your editing patterns to learn your voice
            automatically.
          </p>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.min(100, (episodeCount / 3) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted">
              {episodeCount}/3 episodes
            </span>
          </div>
        </div>
      )}

      {!profile && episodeCount >= 3 && (
        <div className="rounded-lg border border-warning/20 bg-bg-surface p-6 mb-6">
          <p className="text-sm text-text-secondary">
            You have enough episodes processed. Your style profile will be
            generated the next time you process an episode, or you can set
            preferences manually below.
          </p>
        </div>
      )}

      <StyleProfileEditor
        profile={
          profile
            ? {
                tone: profile.tone,
                vocabulary: profile.vocabulary as Record<string, unknown>,
                hookPatterns: profile.hookPatterns as string[],
                platformPreferences: profile.platformPreferences as Record<string, unknown>,
                sampleCount: profile.sampleCount,
                updatedAt: profile.updatedAt.toISOString(),
              }
            : null
        }
      />
    </div>
  );
}
