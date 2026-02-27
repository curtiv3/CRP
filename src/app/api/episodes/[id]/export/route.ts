import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  NEWSLETTER: "Newsletter",
  BLOG: "Blog",
  TIKTOK: "TikTok",
};

const TYPE_LABELS: Record<string, string> = {
  THREAD: "Thread",
  POST: "Post",
  CAPTION: "Caption",
  DRAFT: "Draft",
  TIMESTAMPS: "Timestamps",
};

const querySchema = z.object({
  format: z.enum(["txt", "md"]).default("md"),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireUserContext();
    const { id } = await params;

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      format: url.searchParams.get("format") ?? "md",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid format parameter" },
        { status: 400 },
      );
    }

    const { format } = parsed.data;

    const episode = await prisma.episode.findFirst({
      where: { id, userId: context.userId },
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

    // Group by platform
    const byPlatform = new Map<string, typeof episode.contentPieces>();
    for (const piece of episode.contentPieces) {
      const existing = byPlatform.get(piece.platform) ?? [];
      existing.push(piece);
      byPlatform.set(piece.platform, existing);
    }

    const isMd = format === "md";
    const separator = isMd ? "\n---\n\n" : "\n" + "=".repeat(60) + "\n\n";
    const sections: string[] = [];

    // Header
    if (isMd) {
      sections.push(`# ${episode.title}\n`);
      sections.push(`> Exported from ContentRepurpose\n`);
    } else {
      sections.push(`${episode.title}\n`);
      sections.push(`Exported from ContentRepurpose\n`);
    }

    for (const [platform, pieces] of byPlatform) {
      const label = PLATFORM_LABELS[platform] ?? platform;

      if (isMd) {
        sections.push(`## ${label}\n`);
      } else {
        sections.push(`${label.toUpperCase()}\n${"-".repeat(label.length)}\n`);
      }

      for (const piece of pieces) {
        const typeLabel = TYPE_LABELS[piece.type] ?? piece.type;
        const orderLabel = piece.order > 0 ? ` #${piece.order}` : "";

        if (isMd) {
          sections.push(`### ${typeLabel}${orderLabel}\n\n${piece.content}\n`);
        } else {
          sections.push(`[${typeLabel}${orderLabel}]\n\n${piece.content}\n`);
        }
      }
    }

    const body = sections.join(separator);
    const ext = format;
    // Sanitize filename: strip non-ASCII and special chars, truncate to prevent header injection
    const safeFilename = episode.title
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 100) || "export";

    return new NextResponse(body, {
      headers: {
        "Content-Type": isMd ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeFilename}.${ext}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}.${ext}`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to export content" },
      { status: 500 },
    );
  }
}
