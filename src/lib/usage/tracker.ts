import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UsageOperation } from "@prisma/client";
import { getLimitCentsForTier } from "@/lib/usage/tiers";

// Pricing as of 2025 (USD per token)
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": {
    input: 2.5 / 1_000_000,   // $2.50 per 1M input tokens
    output: 10.0 / 1_000_000, // $10.00 per 1M output tokens
  },
};

// Whisper pricing: $0.006 per minute of audio
const WHISPER_COST_PER_MINUTE = 0.006;

interface ChatUsageResponse {
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Increment the user's UsageBudget by costCents.
 *
 * The budget row is guaranteed to exist because checkBudget() runs
 * before any AI call in processEpisode. We use a plain update as
 * the primary path, which avoids the race condition that upsert has
 * when two concurrent workers both try to create the row.
 *
 * Defensive fallback: if the row somehow doesn't exist (P2025), we
 * create it via upsert. If two callers race on the fallback and one
 * hits the unique constraint (P2002), we retry with a pure update.
 */
async function incrementBudget(
  userId: string,
  costCents: number,
): Promise<void> {
  try {
    // Happy path: row already exists (guaranteed by checkBudget)
    await prisma.usageBudget.update({
      where: { userId },
      data: { currentMonthUsageCents: { increment: costCents } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025" // Record not found
    ) {
      // Defensive: row missing — create it via upsert
      try {
        const limitCents = await getDefaultLimitCents(userId);
        await prisma.usageBudget.upsert({
          where: { userId },
          create: {
            userId,
            monthlyLimitCents: limitCents,
            currentMonthUsageCents: costCents,
            lastResetAt: new Date(),
          },
          update: {
            currentMonthUsageCents: { increment: costCents },
          },
        });
      } catch (upsertError) {
        if (
          upsertError instanceof Prisma.PrismaClientKnownRequestError &&
          upsertError.code === "P2002" // Unique constraint — another caller won the create
        ) {
          await prisma.usageBudget.update({
            where: { userId },
            data: { currentMonthUsageCents: { increment: costCents } },
          });
        } else {
          throw upsertError;
        }
      }
    } else {
      throw error;
    }
  }
}

/**
 * Track usage from an OpenAI chat completion response.
 * Extracts prompt_tokens and completion_tokens from the response,
 * computes cost, writes a UsageRecord, and increments the user's budget.
 */
export async function trackChatUsage(
  userId: string,
  episodeId: string | null,
  operation: UsageOperation,
  model: string,
  response: ChatUsageResponse,
): Promise<void> {
  const usage = response.usage;
  if (!usage) {
    return;
  }

  const inputTokens = usage.prompt_tokens;
  const outputTokens = usage.completion_tokens;

  const pricing = PRICING[model];
  if (!pricing) {
    return;
  }

  const cost =
    inputTokens * pricing.input + outputTokens * pricing.output;
  const costCents = Math.ceil(cost * 100);

  await prisma.usageRecord.create({
    data: {
      userId,
      episodeId,
      operation,
      inputTokens,
      outputTokens,
      cost,
      model,
    },
  });

  await incrementBudget(userId, costCents);
}

/**
 * Track usage from a Whisper transcription call.
 * Cost is based on audio duration, not tokens.
 */
export async function trackTranscriptionUsage(
  userId: string,
  episodeId: string | null,
  durationSeconds: number,
): Promise<void> {
  const durationMinutes = durationSeconds / 60;
  const cost = durationMinutes * WHISPER_COST_PER_MINUTE;
  const costCents = Math.ceil(cost * 100);

  await prisma.usageRecord.create({
    data: {
      userId,
      episodeId,
      operation: "TRANSCRIPTION",
      inputTokens: 0,
      outputTokens: 0,
      cost,
      model: "whisper-1",
    },
  });

  await incrementBudget(userId, costCents);
}

async function getDefaultLimitCents(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });
  return getLimitCentsForTier(user?.subscriptionTier ?? "FREE");
}
