import OpenAI from "openai";
import { getPresignedDownloadUrl } from "@/lib/storage/s3";
import { validateExternalUrl } from "@/lib/validate-url";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  duration: number;
}

export async function transcribeFromFileKey(
  fileKey: string,
): Promise<TranscriptionResult> {
  const downloadUrl = await getPresignedDownloadUrl(fileKey);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const fileName = fileKey.split("/").pop() ?? "audio.mp3";

  const file = new File([arrayBuffer], fileName, {
    type: getMimeType(fileName),
  });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "verbose_json",
  });

  return {
    text: transcription.text,
    duration: Math.round(transcription.duration ?? 0),
  };
}

export async function transcribeFromUrl(
  url: string,
): Promise<TranscriptionResult> {
  // Prevent SSRF — block internal/private network addresses
  validateExternalUrl(url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download from URL: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const file = new File([arrayBuffer], "audio.mp3", {
    type: "audio/mpeg",
  });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "verbose_json",
  });

  return {
    text: transcription.text,
    duration: Math.round(transcription.duration ?? 0),
  };
}

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    mp4: "video/mp4",
  };
  return mimeTypes[ext ?? ""] ?? "audio/mpeg";
}
