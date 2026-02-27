import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { transcribeFromFileKey } from "@/lib/ai/transcribe";
import { analyzeTranscription } from "@/lib/ai/analyze";
import { generateContent } from "@/lib/ai/generate";
import { updateStyleProfile } from "@/lib/ai/style";
import { validateUploadedFileSize } from "@/lib/storage/s3";
import { checkBudget } from "@/lib/usage/guard";
import { checkGlobalLimits } from "@/lib/usage/circuit-breaker";
import type { EpisodeJobData } from "./queue";

export async function processEpisode(
  job: Job<EpisodeJobData>,
): Promise<void> {
  const { episodeId, userId } = job.data;

  // Validate both episode existence and ownership to prevent tampered job data
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, userId },
  });

  if (!episode) {
    throw new Error(`Episode ${episodeId} not found or not owned by user ${userId}`);
  }

  // Idempotency guard: skip if already successfully processed.
  // Prevents duplicate content pieces and wasted AI API calls if a completed
  // job is re-enqueued after BullMQ prunes its completion record.
  if (episode.status === "COMPLETE") {
    return;
  }

  // Email verification gate: don't spend API credits for unverified users
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified) {
    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        status: "FAILED",
        errorMessage:
          "Please verify your email address before processing episodes.",
      },
    });
    return;
  }

  // Global circuit breaker: hard cap on total API spend across all users.
  // This runs before any per-user check as the last line of defence.
  const globalLimits = await checkGlobalLimits();
  if (!globalLimits.allowed) {
    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        status: "FAILED",
        errorMessage:
          "System is temporarily at capacity. Please try again later.",
      },
    });
    return;
  }

  // Per-user budget guard: reject before spending any AI credits
  const budget = await checkBudget(userId);
  if (!budget.allowed) {
    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        status: "FAILED",
        errorMessage:
          "Monthly usage limit reached. Upgrade your plan for more credits.",
      },
    });
    return;
  }

  const tracking = { userId, episodeId };

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

    // Verify the uploaded file doesn't exceed the size limit before processing
    await validateUploadedFileSize(episode.fileKey);

    const transcriptionResult = await transcribeFromFileKey(
      episode.fileKey,
      tracking,
    );

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
      tracking,
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
      tracking,
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
      await updateStyleProfile(userId, episodeId);
    } catch {
      // Style profile update is best-effort; don't fail the episode
    }

    await job.updateProgress(100);
  } catch (error) {
    // Sanitize error message before storing — strip file paths, API keys, and internal details
    const rawMessage =
      error instanceof Error ? error.message : "Unknown processing error";
    const sanitizedMessage = rawMessage
      .replace(/\/[^\s]+/g, "[path]")      // Strip file paths
      .replace(/sk-[a-zA-Z0-9]+/g, "[key]") // Strip OpenAI keys
      .replace(/https?:\/\/[^\s]+/g, "[url]") // Strip URLs that may contain tokens
      .slice(0, 200);

    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        status: "FAILED",
        errorMessage: sanitizedMessage,
      },
    });

    throw error;
  }
}
