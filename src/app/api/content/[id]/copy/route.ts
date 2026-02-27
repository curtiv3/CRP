import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireUserContext();
    const { id } = await params;

    const piece = await prisma.contentPiece.findFirst({
      where: { id, userId: context.userId },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Content piece not found" },
        { status: 404 },
      );
    }

    // Only update to COPIED if still in GENERATED state
    if (piece.status === "GENERATED") {
      await prisma.contentPiece.update({
        where: { id, userId: context.userId },
        data: { status: "COPIED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to track copy" },
      { status: 500 },
    );
  }
}
