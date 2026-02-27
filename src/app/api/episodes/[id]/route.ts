import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { deleteFile } from "@/lib/storage/s3";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireUserContext();
    const { id } = await params;

    const episode = await prisma.episode.findFirst({
      where: { id, userId: context.userId },
      omit: { transcription: true },
      include: {
        contentPieces: {
          orderBy: [{ platform: "asc" }, { order: "asc" }],
        },
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(episode);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch episode" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireUserContext();
    const { id } = await params;

    const episode = await prisma.episode.findFirst({
      where: { id, userId: context.userId },
    });

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 },
      );
    }

    if (episode.fileKey) {
      await deleteFile(episode.fileKey).catch(() => {
        // File deletion is best-effort; episode should still be deleted
      });
    }

    await prisma.episode.delete({ where: { id, userId: context.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete episode" },
      { status: 500 },
    );
  }
}
