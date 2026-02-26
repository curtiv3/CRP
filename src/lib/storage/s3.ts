import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.S3_BUCKET ?? "contentrepurpose";

/** Maximum upload file size: 500 MB */
export const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
};

export function isAllowedFileType(contentType: string): boolean {
  return contentType in ALLOWED_TYPES;
}

/**
 * Validate that a file key follows the expected format and doesn't contain
 * path traversal sequences. Defense-in-depth for all S3 operations.
 */
function assertValidFileKey(fileKey: string): void {
  if (!fileKey.startsWith("uploads/") || fileKey.includes("..")) {
    throw new Error("Invalid file key");
  }
}

export async function createPresignedUploadUrl(
  userId: string,
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; fileKey: string; maxFileSize: number }> {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }

  const fileKey = `uploads/${userId}/${uuidv4()}.${ext}`;

  // Note: ContentLength is intentionally omitted. Setting it on PutObjectCommand
  // would require the upload to be *exactly* that size. Size enforcement is done
  // via validateUploadedFileSize() after upload and on the client before upload.
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 600, // 10 minutes — short-lived upload window
    signableHeaders: new Set(["content-type"]),
  });

  return { uploadUrl, fileKey, maxFileSize: MAX_UPLOAD_SIZE };
}

/**
 * Verify that an uploaded file does not exceed the size limit.
 * Call this after the client uploads and before processing.
 */
export async function validateUploadedFileSize(fileKey: string): Promise<void> {
  assertValidFileKey(fileKey);

  const command = new HeadObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });

  const head = await s3Client.send(command);
  const size = head.ContentLength ?? 0;

  if (size > MAX_UPLOAD_SIZE) {
    // Delete the oversized file
    await deleteFile(fileKey).catch(() => {});
    throw new Error(
      `Uploaded file is ${Math.round(size / 1024 / 1024)}MB, exceeding the ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)}MB limit`,
    );
  }
}

export async function getFileStream(fileKey: string) {
  assertValidFileKey(fileKey);

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });

  const response = await s3Client.send(command);
  return response.Body;
}

export async function getPresignedDownloadUrl(
  fileKey: string,
): Promise<string> {
  assertValidFileKey(fileKey);

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
}

export async function deleteFile(fileKey: string): Promise<void> {
  assertValidFileKey(fileKey);

  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
  });

  await s3Client.send(command);
}
