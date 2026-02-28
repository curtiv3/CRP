import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";
import { deleteFile } from "@/lib/storage/s3";

const deleteSchema = z.object({
  confirmation: z.literal("DELETE", "Type DELETE to confirm account deletion"),
});

export async function DELETE(request: Request) {
  try {
    const context = await requireUserContext();

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Delete S3 files for all episodes
    const episodes = await prisma.episode.findMany({
      where: { userId: context.userId },
      select: { fileKey: true },
    });

    const deletePromises = episodes
      .filter((ep) => ep.fileKey)
      .map((ep) => deleteFile(ep.fileKey!).catch(() => {}));
    await Promise.all(deletePromises);

    // Cascade delete handles Episodes, ContentPieces, StyleProfile,
    // UsageRecords, UsageBudget, Accounts, tokens via onDelete: Cascade
    await prisma.user.delete({
      where: { id: context.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
