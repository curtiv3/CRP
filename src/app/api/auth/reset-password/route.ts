import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export async function POST(request: Request) {
  try {
    // Rate limit by IP to prevent brute-force and expensive token scans
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

    // Find all non-expired tokens and do a timing-safe comparison
    // to prevent timing side-channel attacks on the token value.
    // Capped at 500 to bound memory usage under adversarial conditions.
    const candidates = await prisma.passwordResetToken.findMany({
      where: { expiresAt: { gt: new Date() } },
      select: { id: true, userId: true, token: true },
      take: 500,
    });

    const tokenBuffer = Buffer.from(token);
    const match = candidates.find((c) => {
      const candidateBuffer = Buffer.from(c.token);
      if (tokenBuffer.length !== candidateBuffer.length) {
        return false;
      }
      return timingSafeEqual(tokenBuffer, candidateBuffer);
    });

    if (!match) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(newPassword, 12);

    // Update password and delete ALL tokens for this user in one transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: match.userId },
        data: { passwordHash },
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
