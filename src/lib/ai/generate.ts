import OpenAI from "openai";
import { z } from "zod";
import type { AnalysisResult } from "./analyze";
import { trackChatUsage } from "@/lib/usage/tracker";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedPiece {
  platform: "TWITTER" | "LINKEDIN" | "INSTAGRAM" | "NEWSLETTER" | "BLOG" | "TIKTOK";
  type: "THREAD" | "POST" | "CAPTION" | "DRAFT" | "TIMESTAMPS";
  content: string;
  order: number;
}

const GENERATION_SYSTEM_PROMPT = `You are a social media content writer for podcasters. Generate platform-specific content from podcast analysis segments.

Rules by platform:

TWITTER:
- Generate a thread of 5-8 tweets. Each tweet must be under 280 characters.
- Tweet 1 is the hook — it must grab attention. Use a bold claim, surprising stat, or provocative question.
- Each subsequent tweet should build on the story or argument.
- Final tweet: call to action to listen to the full episode.
- No hashtags unless specifically requested.
- Also generate 3 standalone tweets (separate from the thread) — each a self-contained insight.

LINKEDIN:
- Generate 2 posts. Each 150-300 words.
- Open with a hook: a question, bold statement, or brief story.
- Use line breaks for readability (short paragraphs, 1-2 sentences each).
- Professional but personal tone. Not corporate speak.
- End with a question to drive engagement or a CTA to listen.

INSTAGRAM:
- Generate 3 caption drafts for audiogram/reel posts.
- Each 50-150 words. Conversational, punchy.
- Include a call to action ("Link in bio", "Full episode out now").
- Suggest 3-5 relevant hashtags at the end of each caption.

NEWSLETTER:
- Generate 1 newsletter draft. 300-500 words.
- Conversational summary of the episode.
- Include 2-3 direct quotes from the speaker.
- End with key takeaways as bullet points.
- End with a CTA to listen to the full episode.

BLOG:
- Generate 1 SEO-optimized blog post draft. 800-1200 words.
- Include a compelling title, introduction, 3-5 sections with H2 headings, and a conclusion.
- Weave in quotes and insights from the episode.
- End with a call to action.

TIKTOK:
- Suggest 3-5 timestamp ranges from the content that would make good short clips.
- For each, provide: a suggested hook/caption and why it would work as a short-form clip.
- Format: "Clip idea: [topic] — [why it works]"

CRITICAL: Match the speaker's voice. They said these things — the posts should sound like them, not like a marketing agency. Use their vocabulary, their level of formality, their energy.

Return as JSON with this exact structure:
{
  "pieces": [
    { "platform": "TWITTER", "type": "THREAD", "content": "Tweet 1 text", "order": 1 },
    { "platform": "TWITTER", "type": "THREAD", "content": "Tweet 2 text", "order": 2 },
    { "platform": "TWITTER", "type": "POST", "content": "Standalone tweet", "order": 1 },
    { "platform": "LINKEDIN", "type": "POST", "content": "Full post text", "order": 1 },
    { "platform": "INSTAGRAM", "type": "CAPTION", "content": "Caption text", "order": 1 },
    { "platform": "NEWSLETTER", "type": "DRAFT", "content": "Newsletter text", "order": 0 },
    { "platform": "BLOG", "type": "DRAFT", "content": "Blog post text", "order": 0 },
    { "platform": "TIKTOK", "type": "TIMESTAMPS", "content": "Clip suggestions", "order": 1 }
  ]
}`;

interface StyleProfile {
  tone: string;
  vocabulary: unknown;
  hookPatterns: unknown;
  platformPreferences: unknown;
}

interface VocabularyData {
  preferences?: string[];
  avoidances?: string[];
  emojiUsage?: string;
  hashtagUsage?: string;
}

interface PlatformPreferencesData {
  formalityScore?: number;
  signaturePatterns?: string[];
}

const EMOJI_DESCRIPTIONS: Record<string, string> = {
  none: "Do NOT use any emojis.",
  minimal: "Use emojis sparingly — at most 1 per post, only when it adds clarity.",
  moderate: "Use 1-2 emojis per post at natural hook points or emphasis moments.",
  heavy: "Use 2-3 emojis per post minimum. Place them at hooks and key points. Example: '🔥 Ever wondered why...' — not just one emoji in the entire output.",
};

const HASHTAG_DESCRIPTIONS: Record<string, string> = {
  none: "Do NOT include hashtags on any platform.",
  minimal: "Include 1-2 hashtags only where highly relevant.",
  platform_specific: "Add 3-5 hashtags on Instagram, none on Twitter, 1-3 on LinkedIn.",
};

function buildStyleBlock(style: StyleProfile): string {
  const vocab = style.vocabulary as VocabularyData | undefined;
  const platformPrefs = style.platformPreferences as PlatformPreferencesData | undefined;
  const hooks = style.hookPatterns as string[] | undefined;

  const lines: string[] = [
    "",
    "---",
    "MANDATORY STYLE RULES (override all other instructions):",
  ];

  lines.push(`- Tone: ${style.tone}`);

  if (platformPrefs?.formalityScore) {
    lines.push(`- Formality: ${platformPrefs.formalityScore}/10`);
  }

  if (vocab?.emojiUsage) {
    const desc = EMOJI_DESCRIPTIONS[vocab.emojiUsage] ?? EMOJI_DESCRIPTIONS.none;
    lines.push(`- Emoji usage: ${vocab.emojiUsage.toUpperCase()} — ${desc}`);
  }

  if (vocab?.preferences && vocab.preferences.length > 0) {
    lines.push(`- Vocabulary: MUST use these words/phrases naturally: "${vocab.preferences.join('", "')}"`);
  }

  if (vocab?.avoidances && vocab.avoidances.length > 0) {
    lines.push(`- Vocabulary: NEVER use these words: "${vocab.avoidances.join('", "')}"`);
  }

  if (hooks && hooks.length > 0) {
    lines.push(`- Hook patterns: ${hooks.join(", ")}`);
  }

  if (vocab?.hashtagUsage) {
    const desc = HASHTAG_DESCRIPTIONS[vocab.hashtagUsage] ?? HASHTAG_DESCRIPTIONS.none;
    lines.push(`- Hashtag usage: ${desc}`);
  }

  if (platformPrefs?.signaturePatterns && platformPrefs.signaturePatterns.length > 0) {
    lines.push(`- Signature patterns: ${platformPrefs.signaturePatterns.join("; ")}`);
  }

  lines.push("---");

  return lines.join("\n");
}

interface TrackingContext {
  userId: string;
  episodeId: string | null;
}

export async function generateContent(
  analysis: AnalysisResult,
  episodeTitle: string,
  transcription: string,
  styleProfile?: StyleProfile | null,
  tracking?: TrackingContext,
): Promise<GeneratedPiece[]> {
  const segmentsText = analysis.segments
    .map((s) => `[${s.type}] ${s.content}${s.context ? ` (Context: ${s.context})` : ""}`)
    .join("\n\n");

  const userPrompt = `Episode: "${episodeTitle}"

Summary: ${analysis.summary}

Main Topics: ${analysis.mainTopics.join(", ")}

Key Segments:
${segmentsText}

Full transcript excerpt (first 3000 chars for voice matching):
${transcription.slice(0, 3000)}`;

  // Inject style rules into system prompt for stronger adherence
  const systemPrompt = styleProfile
    ? GENERATION_SYSTEM_PROMPT + buildStyleBlock(styleProfile)
    : GENERATION_SYSTEM_PROMPT;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4096,
  });

  if (tracking) {
    await trackChatUsage(
      tracking.userId,
      tracking.episodeId,
      "GENERATION",
      "gpt-4o",
      response,
    );
  }

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No generation content returned from AI");
  }

  const raw = JSON.parse(content) as Record<string, unknown>;

  if (!raw.pieces || !Array.isArray(raw.pieces)) {
    throw new Error("Invalid generation format: missing pieces array");
  }

  // Validate each piece against the expected schema to catch AI hallucinations
  const pieceSchema = z.object({
    platform: z.enum(["TWITTER", "LINKEDIN", "INSTAGRAM", "NEWSLETTER", "BLOG", "TIKTOK"]),
    type: z.enum(["THREAD", "POST", "CAPTION", "DRAFT", "TIMESTAMPS"]),
    content: z.string().min(1).max(10000),
    order: z.number().int().min(0),
  });

  const validPieces: GeneratedPiece[] = [];
  for (const piece of raw.pieces) {
    const result = pieceSchema.safeParse(piece);
    if (result.success) {
      validPieces.push(result.data);
    }
    // Silently skip malformed pieces rather than failing the entire generation
  }

  if (validPieces.length === 0) {
    throw new Error("AI returned no valid content pieces");
  }

  return validPieces;
}
