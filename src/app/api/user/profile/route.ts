import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";

const updateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export async function PATCH(request: Request) {
  try {
    const context = await requireUserContext();

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: context.userId },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
