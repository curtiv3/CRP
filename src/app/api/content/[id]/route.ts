import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";

const updateContentSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000, "Content is too long").optional(),
  status: z.enum(["GENERATED", "EDITED", "COPIED", "PUBLISHED"]).optional(),
}).refine((data) => data.content !== undefined || data.status !== undefined, {
  message: "At least one of content or status is required",
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireUserContext();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const piece = await prisma.contentPiece.findFirst({
      where: { id, userId: context.userId },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Content piece not found" },
        { status: 404 },
      );
    }

    const updateData: Record<string, string> = {};
    if (parsed.data.content !== undefined) {
      updateData.content = parsed.data.content;
      // Set to EDITED when content changes (unless explicitly set)
      if (parsed.data.status === undefined) {
        updateData.status = "EDITED";
      }
    }
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
    }

    const updated = await prisma.contentPiece.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 },
    );
  }
}
