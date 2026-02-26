import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserContext } from "@/lib/auth-context";
import { createPresignedUploadUrl, isAllowedFileType } from "@/lib/storage/s3";

const presignSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
});

export async function POST(request: Request) {
  try {
    const context = await requireUserContext();

    const body = await request.json();
    const parsed = presignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { fileName, contentType } = parsed.data;

    if (!isAllowedFileType(contentType)) {
      return NextResponse.json(
        { error: "Unsupported file type. Accepted: .mp3, .wav, .m4a, .mp4" },
        { status: 400 },
      );
    }

    const { uploadUrl, fileKey } = await createPresignedUploadUrl(
      context.userId,
      fileName,
      contentType,
    );

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
