import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { trackChatUsage } from "@/lib/usage/tracker";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StyleProfileData {
  tone: string;
  formalityScore: number;
  averageSentenceLength: number;
  commonHooks: string[];
  vocabularyPreferences: string[];
  vocabularyAvoidances: string[];
  emojiUsage: string;
  hashtagUsage: string;
  signaturePatterns: string[];
  platformDifferences: Record<string, Record<string, string>>;
}

const STYLE_ANALYSIS_PROMPT = `Analyze the following collection of edited social media posts by this creator. Identify their writing patterns.

Return structured JSON with this exact structure:
{
  "tone": "casual" | "professional" | "mixed",
  "formalityScore": 1-10,
  "averageSentenceLength": number,
  "commonHooks": ["question", "bold_claim", "story_opening", etc.],
  "vocabularyPreferences": ["words or phrases they use often"],
  "vocabularyAvoidances": ["words or phrases they never use or edited out"],
  "emojiUsage": "none" | "minimal" | "moderate" | "heavy",
  "hashtagUsage": "none" | "minimal" | "platform_specific",
  "signaturePatterns": ["any recurring phrases, sign-offs, or structural patterns"],
  "platformDifferences": {
    "TWITTER": { "tone": "...", "style_notes": "..." },
    "LINKEDIN": { "tone": "...", "style_notes": "..." }
  }
}

Focus on patterns that distinguish this creator from generic AI output. Look for:
- How they open posts (questions? bold claims? stories?)
- Sentence rhythm (short and punchy? flowing and detailed?)
- Vocabulary choices (formal vs casual, jargon, colloquialisms)
- Structural preferences (line breaks, bullet points, paragraphs)
- Platform-specific differences in how they write

If there aren't enough samples to detect a clear pattern for a field, use reasonable defaults and note it in signaturePatterns.`;

interface TrackingContext {
  userId: string;
  episodeId: string | null;
}

export async function analyzeStyleFromContent(
  editedPieces: Array<{ platform: string; content: string }>,
  tracking?: TrackingContext,
): Promise<StyleProfileData> {
  const contentByPlatform = new Map<string, string[]>();
  for (const piece of editedPieces) {
    const existing = contentByPlatform.get(piece.platform) ?? [];
    existing.push(piece.content);
    contentByPlatform.set(piece.platform, existing);
  }

  let samplesText = "";
  for (const [platform, contents] of contentByPlatform) {
    samplesText += `\n\n=== ${platform} ===\n`;
    samplesText += contents.map((c, i) => `--- Sample ${i + 1} ---\n${c}`).join("\n\n");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: STYLE_ANALYSIS_PROMPT },
      {
        role: "user",
        content: `Analyze these ${editedPieces.length} content pieces from this creator:\n${samplesText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  if (tracking) {
    await trackChatUsage(
      tracking.userId,
      tracking.episodeId,
      "STYLE_ANALYSIS",
      "gpt-4o",
      response,
    );
  }

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No style analysis content returned from AI");
  }

  const raw = JSON.parse(content) as Record<string, unknown>;

  const styleSchema = z.object({
    tone: z.enum(["casual", "professional", "mixed"]),
    formalityScore: z.number().min(1).max(10),
    averageSentenceLength: z.number().min(0),
    commonHooks: z.array(z.string().max(200)).max(20),
    vocabularyPreferences: z.array(z.string().max(200)).max(50),
    vocabularyAvoidances: z.array(z.string().max(200)).max(50),
    emojiUsage: z.enum(["none", "minimal", "moderate", "heavy"]),
    hashtagUsage: z.enum(["none", "minimal", "platform_specific"]),
    signaturePatterns: z.array(z.string().max(500)).max(20),
    platformDifferences: z.record(z.string(), z.record(z.string(), z.string().max(500))),
  });

  const result = styleSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid style analysis format: ${result.error.issues[0].message}`);
  }

  return result.data as StyleProfileData;
}

export async function updateStyleProfile(
  userId: string,
  episodeId?: string | null,
): Promise<void> {
  // Count completed episodes for this user
  const completedCount = await prisma.episode.count({
    where: { userId, status: "COMPLETE" },
  });

  if (completedCount < 3) {
    return; // Not enough data yet
  }

  // Gather all content pieces (prefer edited ones, fall back to generated)
  const pieces = await prisma.contentPiece.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 100, // Cap to avoid huge prompts
    select: {
      platform: true,
      content: true,
      status: true,
    },
  });

  if (pieces.length < 5) {
    return; // Not enough content pieces
  }

  // Prefer edited pieces but include generated if we need volume
  const edited = pieces.filter((p) => p.status === "EDITED");
  const samplePieces =
    edited.length >= 5
      ? edited.slice(0, 50)
      : pieces.slice(0, 50);

  const styleData = await analyzeStyleFromContent(
    samplePieces.map((p) => ({ platform: p.platform, content: p.content })),
    { userId, episodeId: episodeId ?? null },
  );

  const aiVocabulary = {
    preferences: styleData.vocabularyPreferences,
    avoidances: styleData.vocabularyAvoidances,
    emojiUsage: styleData.emojiUsage,
    hashtagUsage: styleData.hashtagUsage,
  };
  const aiPlatformPrefs = {
    formalityScore: styleData.formalityScore,
    averageSentenceLength: styleData.averageSentenceLength,
    signaturePatterns: styleData.signaturePatterns,
    platformDifferences: styleData.platformDifferences,
  };

  // Check for existing manual overrides — keep user-configured fields
  const existing = await prisma.styleProfile.findUnique({
    where: { userId },
  });

  const overrides = (existing?.manualOverrides as Record<string, boolean>) ?? {};

  const updateData = {
    ...(overrides.tone ? {} : { tone: styleData.tone }),
    ...(overrides.vocabulary ? {} : { vocabulary: aiVocabulary }),
    ...(overrides.hookPatterns ? {} : { hookPatterns: styleData.commonHooks }),
    ...(overrides.platformPreferences ? {} : { platformPreferences: aiPlatformPrefs }),
    sampleCount: completedCount,
  };

  await prisma.styleProfile.upsert({
    where: { userId },
    create: {
      userId,
      tone: styleData.tone,
      vocabulary: aiVocabulary,
      hookPatterns: styleData.commonHooks,
      platformPreferences: aiPlatformPrefs,
      sampleCount: completedCount,
    },
    update: updateData,
  });
}
