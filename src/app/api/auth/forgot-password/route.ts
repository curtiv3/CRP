import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email/send";

const schema = z.object({
  email: z.string().email().max(254),
});

// Identical response for all paths to prevent user enumeration
const GENERIC_RESPONSE = {
  message: "If an account with that email exists, a reset link has been sent.",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Rate limit: 3 requests per hour per email
    const rl = checkRateLimit(
      `forgot-password:${email.toLowerCase()}`,
      3,
      60 * 60 * 1000,
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    // Only send reset for credentials accounts (not OAuth-only)
    if (user?.passwordHash) {
      // Delete any existing tokens for this user to keep the table clean
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const token = randomUUID();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Fire-and-forget: don't fail the response if email delivery fails
      sendPasswordResetEmail(email, token).catch(() => {
        // Email delivery is best-effort
      });
    }

    // Always return success to prevent enumeration
    return NextResponse.json(GENERIC_RESPONSE);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
