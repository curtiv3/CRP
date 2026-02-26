import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { addEpisodeJob } from "@/lib/jobs/queue";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { validateExternalUrl } from "@/lib/validate-url";

const createEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
  sourceType: z.enum(["UPLOAD", "YOUTUBE_URL", "PODCAST_URL"]),
  sourceUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
});

/** Free tier: 2 episodes/month */
const FREE_TIER_MONTHLY_LIMIT = 2;

export async function POST(request: Request) {
  try {
    const context = await requireUserContext();

    // Rate limit: 10 episode creations per hour per user
    const rl = checkRateLimit(`episodes:${context.userId}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many episodes created. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = await request.json();
    const parsed = createEpisodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { title, description, sourceType, sourceUrl, fileKey } = parsed.data;

    if (sourceType === "UPLOAD" && !fileKey) {
      return NextResponse.json(
        { error: "File key is required for uploads" },
        { status: 400 },
      );
    }

    // Validate fileKey belongs to the authenticated user (prevent cross-user S3 access)
    if (sourceType === "UPLOAD" && fileKey) {
      if (!fileKey.startsWith(`uploads/${context.userId}/`)) {
        return NextResponse.json(
          { error: "Invalid file key" },
          { status: 403 },
        );
      }
    }

    if (
      (sourceType === "YOUTUBE_URL" || sourceType === "PODCAST_URL") &&
      !sourceUrl
    ) {
      return NextResponse.json(
        { error: "URL is required for URL-based sources" },
        { status: 400 },
      );
    }

    // Validate sourceUrl against SSRF if provided
    if (sourceUrl) {
      try {
        validateExternalUrl(sourceUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid or disallowed URL" },
          { status: 400 },
        );
      }
    }

    // Enforce subscription tier limits
    if (context.user.subscriptionTier === "FREE") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const episodesThisMonth = await prisma.episode.count({
        where: {
          userId: context.userId,
          createdAt: { gte: startOfMonth },
        },
      });

      if (episodesThisMonth >= FREE_TIER_MONTHLY_LIMIT) {
        return NextResponse.json(
          { error: "Free tier limit reached (2 episodes per month). Upgrade to Pro for unlimited episodes." },
          { status: 403 },
        );
      }
    }

    const episode = await prisma.episode.create({
      data: {
        userId: context.userId,
        title,
        description,
        sourceType,
        sourceUrl,
        fileKey,
        status: sourceType === "UPLOAD" ? "TRANSCRIBING" : "UPLOADING",
      },
    });

    await addEpisodeJob(episode.id, context.userId);

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create episode" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const context = await requireUserContext();

    const episodes = await prisma.episode.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contentPieces: true } },
      },
    });

    return NextResponse.json(episodes);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 },
    );
  }
}
