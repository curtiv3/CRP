import OpenAI from "openai";
import { getPresignedDownloadUrl, MAX_UPLOAD_SIZE } from "@/lib/storage/s3";
import { validateResolvedUrl } from "@/lib/validate-url";
import { trackTranscriptionUsage } from "@/lib/usage/tracker";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Maximum size for URL-based downloads (same limit as file uploads). */
const MAX_DOWNLOAD_SIZE = MAX_UPLOAD_SIZE;

export interface TranscriptionResult {
  text: string;
  duration: number;
}

interface TrackingContext {
  userId: string;
  episodeId: string | null;
}

/**
 * Sanitize a filename so Whisper doesn't reject it due to special
 * characters (parentheses, spaces, unicode). Whisper uses the
 * filename for format detection, so the extension must be preserved.
 */
function sanitizeFileName(rawName: string): string {
  const ext = rawName.split(".").pop()?.toLowerCase() || "mp3";
  const baseName = rawName.replace(/\.[^.]+$/, "");
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sanitized || "audio"}.${ext}`;
}

export async function transcribeFromFileKey(
  fileKey: string,
  tracking?: TrackingContext,
): Promise<TranscriptionResult> {
  const downloadUrl = await getPresignedDownloadUrl(fileKey);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const rawName = fileKey.split("/").pop() ?? "audio.mp3";
  const fileName = sanitizeFileName(rawName);

  const file = new File([arrayBuffer], fileName, {
    type: getMimeType(fileName),
  });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "verbose_json",
  });

  const duration = Math.round(transcription.duration ?? 0);

  if (tracking) {
    await trackTranscriptionUsage(
      tracking.userId,
      tracking.episodeId,
      duration,
    );
  }

  return {
    text: transcription.text,
    duration,
  };
}

/**
 * Download from a URL with a streaming size check to prevent OOM from
 * oversized responses. Reads chunks incrementally and aborts if the
 * cumulative size exceeds the limit.
 */
async function fetchWithSizeLimit(url: string, maxBytes: number): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download from URL: ${response.statusText}`);
  }

  // Early rejection if Content-Length header is present and too large
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > maxBytes) {
    throw new Error(
      `File too large: ${Math.round(contentLength / 1024 / 1024)}MB exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit`,
    );
  }

  // Stream the body to enforce limit even if Content-Length is absent or lies
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body from URL");
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > maxBytes) {
        throw new Error(
          `Download exceeded ${Math.round(maxBytes / 1024 / 1024)}MB size limit`,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks into a single ArrayBuffer
  const combined = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined.buffer;
}

export async function transcribeFromUrl(
  url: string,
  tracking?: TrackingContext,
): Promise<TranscriptionResult> {
  // Prevent SSRF — block internal/private addresses and DNS rebinding
  await validateResolvedUrl(url);

  const arrayBuffer = await fetchWithSizeLimit(url, MAX_DOWNLOAD_SIZE);

  // Derive a filename from the URL path; sanitize to avoid Whisper rejections
  const urlPath = new URL(url).pathname;
  const rawName = urlPath.split("/").pop() || "audio.mp3";
  const fileName = sanitizeFileName(rawName);

  const file = new File([arrayBuffer], fileName, {
    type: getMimeType(fileName),
  });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "verbose_json",
  });

  const duration = Math.round(transcription.duration ?? 0);

  if (tracking) {
    await trackTranscriptionUsage(
      tracking.userId,
      tracking.episodeId,
      duration,
    );
  }

  return {
    text: transcription.text,
    duration,
  };
}

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    mp4: "video/mp4",
    flac: "audio/flac",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    webm: "audio/webm",
    mpeg: "audio/mpeg",
    mpga: "audio/mpeg",
  };
  return mimeTypes[ext ?? ""] ?? "audio/mpeg";
}
