import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { transcribeFromFileKey } from "@/lib/ai/transcribe";
import type { EpisodeJobData } from "./queue";

export async function processEpisode(
  job: Job<EpisodeJobData>,
): Promise<void> {
  const { episodeId } = job.data;

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

    await job.updateProgress(10);

    if (!episode.fileKey) {
      throw new Error("Episode has no file key for transcription");
    }

    const result = await transcribeFromFileKey(episode.fileKey);

    await job.updateProgress(60);

    // Store transcription and mark analyzing (future step)
    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        transcription: result.text,
        duration: result.duration,
        status: "COMPLETE",
        processedAt: new Date(),
      },
    });

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
