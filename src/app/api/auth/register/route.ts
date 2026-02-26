import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 5 registrations per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Return same shape as success to prevent user enumeration
      return NextResponse.json(
        { message: "If this email is available, a confirmation has been sent." },
        { status: 200 },
      );
    }

    const passwordHash = await hash(password, 12);

    await prisma.user.create({
      data: { email, name, passwordHash },
    });

    return NextResponse.json(
      { message: "If this email is available, a confirmation has been sent." },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
