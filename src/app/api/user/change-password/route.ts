import { NextResponse } from "next/server";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must include uppercase, lowercase, and a number",
    ),
});

export async function POST(request: Request) {
  try {
    const context = await requireUserContext();

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Account uses social login — password cannot be changed" },
        { status: 400 },
      );
    }

    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: context.userId },
      data: {
        passwordHash,
        securityStamp: crypto.randomUUID(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
