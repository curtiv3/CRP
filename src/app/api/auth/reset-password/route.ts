import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1).max(100),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export async function POST(request: Request) {
  try {
    // Rate limit by IP to prevent brute-force token guessing
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rl = checkRateLimit(`reset-password:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { token, newPassword } = parsed.data;

    // Direct DB lookup by indexed unique token column. Safe because tokens
    // are 122-bit UUIDs (randomUUID) — brute-force is infeasible even with
    // perfect timing info. This replaces the previous O(n) scan + timingSafeEqual
    // approach which had a 500-row cap and leaked table size via response time.
    const match = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!match || match.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(newPassword, 12);

    // Update password, rotate securityStamp (invalidates all existing JWT
    // sessions), and delete ALL tokens for this user in one transaction.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: match.userId },
        data: { passwordHash, securityStamp: randomUUID() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: match.userId },
      }),
    ]);

    return NextResponse.json({ message: "Password has been reset" });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
