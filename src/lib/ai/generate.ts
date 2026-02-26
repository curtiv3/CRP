import OpenAI from "openai";
import type { AnalysisResult } from "./analyze";

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

export async function generateContent(
  analysis: AnalysisResult,
  episodeTitle: string,
  transcription: string,
  styleProfile?: StyleProfile | null,
): Promise<GeneratedPiece[]> {
  const segmentsText = analysis.segments
    .map((s) => `[${s.type}] ${s.content}${s.context ? ` (Context: ${s.context})` : ""}`)
    .join("\n\n");

  let userPrompt = `Episode: "${episodeTitle}"

Summary: ${analysis.summary}

Main Topics: ${analysis.mainTopics.join(", ")}

Key Segments:
${segmentsText}

Full transcript excerpt (first 3000 chars for voice matching):
${transcription.slice(0, 3000)}`;

  if (styleProfile) {
    userPrompt += `\n\nApply these style preferences: ${JSON.stringify(styleProfile)}`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: GENERATION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4096,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No generation content returned from AI");
  }

  const parsed = JSON.parse(content) as { pieces: GeneratedPiece[] };

  if (!parsed.pieces || !Array.isArray(parsed.pieces)) {
    throw new Error("Invalid generation format: missing pieces array");
  }

  return parsed.pieces;
}
