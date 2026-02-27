import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing-token", request.url),
    );
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-token", request.url),
    );
  }

  if (record.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return NextResponse.redirect(
      new URL("/login?error=expired-token", request.url),
    );
  }

  // Mark email as verified and delete the token in one transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);

  return NextResponse.redirect(
    new URL("/dashboard?verified=true", request.url),
  );
}
