import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/auth-context";

export async function GET() {
  try {
    const context = await requireUserContext();

    const profile = await prisma.styleProfile.findUnique({
      where: { userId: context.userId },
    });

    if (!profile) {
      return NextResponse.json(null);
    }

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch style profile" },
      { status: 500 },
    );
  }
}

const updateSchema = z.object({
  tone: z.enum(["casual", "professional", "mixed"]).optional(),
  vocabulary: z
    .object({
      preferences: z.array(z.string().max(100)).max(50).optional(),
      avoidances: z.array(z.string().max(100)).max(50).optional(),
      emojiUsage: z.enum(["none", "minimal", "moderate", "heavy"]).optional(),
      hashtagUsage: z.enum(["none", "minimal", "platform_specific"]).optional(),
    })
    .optional(),
  hookPatterns: z.array(z.string().max(200)).max(20).optional(),
  platformPreferences: z
    .object({
      formalityScore: z.number().min(1).max(10).optional(),
      signaturePatterns: z.array(z.string().max(200)).max(20).optional(),
    })
    .strict()
    .optional(),
});

export async function PUT(request: Request) {
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

    const data = parsed.data;

    const existing = await prisma.styleProfile.findUnique({
      where: { userId: context.userId },
    });

    if (existing) {
      // Merge vocabulary and platformPreferences with existing values
      const mergedVocabulary = data.vocabulary
        ? { ...(existing.vocabulary as Record<string, unknown>), ...data.vocabulary }
        : (existing.vocabulary as Record<string, unknown>);

      const mergedPlatformPrefs = data.platformPreferences
        ? { ...(existing.platformPreferences as Record<string, unknown>), ...data.platformPreferences }
        : (existing.platformPreferences as Record<string, unknown>);

      const updated = await prisma.styleProfile.update({
        where: { userId: context.userId },
        data: {
          ...(data.tone !== undefined && { tone: data.tone }),
          vocabulary: mergedVocabulary as Prisma.InputJsonValue,
          ...(data.hookPatterns !== undefined && { hookPatterns: data.hookPatterns as Prisma.InputJsonValue }),
          platformPreferences: mergedPlatformPrefs as Prisma.InputJsonValue,
        },
      });

      return NextResponse.json(updated);
    }

    // Create new profile with overrides
    const created = await prisma.styleProfile.create({
      data: {
        userId: context.userId,
        tone: data.tone ?? "mixed",
        vocabulary: (data.vocabulary ?? {}) as Prisma.InputJsonValue,
        hookPatterns: (data.hookPatterns ?? []) as Prisma.InputJsonValue,
        platformPreferences: (data.platformPreferences ?? {}) as Prisma.InputJsonValue,
        sampleCount: 0,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update style profile" },
      { status: 500 },
    );
  }
}
