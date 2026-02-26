import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";

const updateContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
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

    const updated = await prisma.contentPiece.update({
      where: { id },
      data: {
        content: parsed.data.content,
        status: "EDITED",
      },
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
