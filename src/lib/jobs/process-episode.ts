import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { transcribeFromFileKey } from "@/lib/ai/transcribe";
import { analyzeTranscription } from "@/lib/ai/analyze";
import { generateContent } from "@/lib/ai/generate";
import { updateStyleProfile } from "@/lib/ai/style";
import type { EpisodeJobData } from "./queue";

export async function processEpisode(
  job: Job<EpisodeJobData>,
): Promise<void> {
  const { episodeId, userId } = job.data;

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
  });

  if (!episode) {
    throw new Error(`Episode ${episodeId} not found`);
  }

  try {
    // Step 1: Transcription
    await prisma.episode.update({
      where: { id: episodeId },
      data: { status: "TRANSCRIBING" },
    });

    await job.updateProgress(5);

    if (!episode.fileKey) {
      throw new Error("Episode has no file key for transcription");
    }

    const transcriptionResult = await transcribeFromFileKey(episode.fileKey);

    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        transcription: transcriptionResult.text,
        duration: transcriptionResult.duration,
      },
    });

    await job.updateProgress(30);

    // Step 2: Analysis
    await prisma.episode.update({
      where: { id: episodeId },
      data: { status: "ANALYZING" },
    });

    const analysis = await analyzeTranscription(
      transcriptionResult.text,
      episode.title,
    );

    await job.updateProgress(55);

    // Step 3: Content Generation
    await prisma.episode.update({
      where: { id: episodeId },
      data: { status: "GENERATING" },
    });

    const styleProfile = await prisma.styleProfile.findUnique({
      where: { userId },
    });

    const pieces = await generateContent(
      analysis,
      episode.title,
      transcriptionResult.text,
      styleProfile,
    );

    await job.updateProgress(85);

    // Step 4: Store content pieces
    if (pieces.length > 0) {
      await prisma.contentPiece.createMany({
        data: pieces.map((piece) => ({
          episodeId,
          userId,
          platform: piece.platform,
          type: piece.type,
          content: piece.content,
          order: piece.order,
        })),
      });
    }

    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        status: "COMPLETE",
        processedAt: new Date(),
      },
    });

    await job.updateProgress(95);

    // Step 5: Update style profile (non-blocking — don't fail the job)
    try {
      await updateStyleProfile(userId);
    } catch {
      // Style profile update is best-effort; don't fail the episode
    }

    await job.updateProgress(100);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";

    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    throw error;
  }
}
