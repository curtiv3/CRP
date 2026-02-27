import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || token.length > 100) {
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

  // Direct DB lookup by indexed unique token column. Safe because tokens
  // are 122-bit UUIDs (randomUUID) — brute-force is infeasible even with
  // perfect timing info. Replaces the previous O(n) scan which had a
  // 500-row cap and response time that leaked the table size.
  const match = await prisma.emailVerificationToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!match || match.expiresAt <= new Date()) {
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
