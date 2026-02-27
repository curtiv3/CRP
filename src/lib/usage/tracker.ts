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

  await prisma.$transaction([
    prisma.usageRecord.create({
      data: {
        userId,
        episodeId,
        operation,
        inputTokens,
        outputTokens,
        cost,
        model,
      },
    }),
    prisma.usageBudget.upsert({
      where: { userId },
      create: {
        userId,
        monthlyLimitCents: await getDefaultLimitCents(userId),
        currentMonthUsageCents: costCents,
        lastResetAt: new Date(),
      },
      update: {
        currentMonthUsageCents: { increment: costCents },
      },
    }),
  ]);
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

  await prisma.$transaction([
    prisma.usageRecord.create({
      data: {
        userId,
        episodeId,
        operation: "TRANSCRIPTION",
        inputTokens: 0,
        outputTokens: 0,
        cost,
        model: "whisper-1",
      },
    }),
    prisma.usageBudget.upsert({
      where: { userId },
      create: {
        userId,
        monthlyLimitCents: await getDefaultLimitCents(userId),
        currentMonthUsageCents: costCents,
        lastResetAt: new Date(),
      },
      update: {
        currentMonthUsageCents: { increment: costCents },
      },
    }),
  ]);
}

async function getDefaultLimitCents(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });
  return getLimitCentsForTier(user?.subscriptionTier ?? "FREE");
}
