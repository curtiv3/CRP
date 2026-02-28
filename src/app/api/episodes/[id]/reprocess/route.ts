import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { addEpisodeJob } from "@/lib/jobs/queue";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireUserContext();
    const { id } = await params;

    // Rate limit: 5 reprocess requests per hour per user
    const rl = checkRateLimit(
      `reprocess:${context.userId}`,
      5,
      60 * 60 * 1000,
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many retry attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const episode = await prisma.episode.findFirst({
      where: { id, userId: context.userId },
    });

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    if (episode.status !== "FAILED") {
      return NextResponse.json(
        { error: "Only failed episodes can be reprocessed" },
        { status: 400 },
      );
    }

    // Delete existing content pieces for a clean slate
    await prisma.contentPiece.deleteMany({
      where: { episodeId: id },
    });

    // Reset episode status based on source type
    const newStatus =
      episode.sourceType === "UPLOAD" ? "TRANSCRIBING" : "UPLOADING";

    const updated = await prisma.episode.update({
      where: { id },
      data: {
        status: newStatus,
        errorMessage: null,
      },
    });

    await addEpisodeJob(episode.id, context.userId);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to reprocess episode" },
      { status: 500 },
    );
  }
}
