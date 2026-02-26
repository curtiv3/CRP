import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { addEpisodeJob } from "@/lib/jobs/queue";

const createEpisodeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sourceType: z.enum(["UPLOAD", "YOUTUBE_URL", "PODCAST_URL"]),
  sourceUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireUserContext();

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

    if (
      (sourceType === "YOUTUBE_URL" || sourceType === "PODCAST_URL") &&
      !sourceUrl
    ) {
      return NextResponse.json(
        { error: "URL is required for URL-based sources" },
        { status: 400 },
      );
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
