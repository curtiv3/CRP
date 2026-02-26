import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisSegment {
  type: "KEY_QUOTE" | "STORY" | "ARGUMENT" | "HOOK" | "TAKEAWAY";
  content: string;
  timestamp?: string;
  context?: string;
}

export interface AnalysisResult {
  segments: AnalysisSegment[];
  summary: string;
  mainTopics: string[];
}

const ANALYSIS_SYSTEM_PROMPT = `You are a content analyst for podcast episodes. Your job is to identify the most engaging, shareable, and valuable segments from a transcript.

Extract:
1. KEY_QUOTE: Direct quotes that are punchy, insightful, or controversial
2. STORY: Personal anecdotes or case studies that would resonate on social media
3. ARGUMENT: Strong opinions or frameworks the speaker presents
4. HOOK: Potential opening lines for social posts based on the content
5. TAKEAWAY: Core lessons or actionable advice

Also provide:
- A 2-3 sentence summary of the episode
- The 3-5 main topics discussed

Return as JSON with this exact structure:
{
  "segments": [
    { "type": "KEY_QUOTE", "content": "...", "context": "brief context for this quote" },
    { "type": "STORY", "content": "...", "context": "what the story is about" },
    { "type": "ARGUMENT", "content": "...", "context": "the core claim" },
    { "type": "HOOK", "content": "...", "context": "what topic this hooks into" },
    { "type": "TAKEAWAY", "content": "...", "context": "why this matters" }
  ],
  "summary": "...",
  "mainTopics": ["topic1", "topic2", "topic3"]
}

Be selective — quality over quantity. A 60-minute episode should yield 8-12 key segments, not 50. A 10-minute episode should yield 4-6.`;

export async function analyzeTranscription(
  transcription: string,
  episodeTitle: string,
): Promise<AnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Episode title: "${episodeTitle}"\n\nTranscript:\n${transcription}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No analysis content returned from AI");
  }

  const parsed = JSON.parse(content) as AnalysisResult;

  if (!parsed.segments || !Array.isArray(parsed.segments)) {
    throw new Error("Invalid analysis format: missing segments array");
  }

  return parsed;
}
