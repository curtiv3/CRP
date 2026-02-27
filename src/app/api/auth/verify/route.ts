import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing-token", request.url),
    );
  }

  // Rate limit by IP to prevent brute-force token guessing
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`verify-email:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.redirect(
      new URL("/login?error=rate-limited", request.url),
    );
  }

  // Load all non-expired tokens and use timing-safe comparison to prevent
  // timing side-channel attacks (matching the pattern in reset-password)
  const candidates = await prisma.emailVerificationToken.findMany({
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
    return NextResponse.redirect(
      new URL("/login?error=invalid-token", request.url),
    );
  }

  // Mark email as verified and delete the token in one transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: match.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: match.id } }),
  ]);

  return NextResponse.redirect(
    new URL("/dashboard?verified=true", request.url),
  );
}
