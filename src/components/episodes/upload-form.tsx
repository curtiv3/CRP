"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SourceMode = "upload" | "url";

interface UploadState {
  step: "idle" | "uploading" | "creating" | "done" | "error";
  progress: number;
  error: string | null;
}

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
  "audio/mp4",
  "video/mp4",
];

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.mp4";

export function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>({
    step: "idle",
    progress: 0,
    error: null,
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setState({
        step: "error",
        progress: 0,
        error: "Unsupported file type. Accepted: .mp3, .wav, .m4a, .mp4",
      });
      return;
    }
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
    setState({ step: "idle", progress: 0, error: null });
  }, [title]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setState({ step: "error", progress: 0, error: "Title is required" });
      return;
    }

    if (sourceMode === "upload" && !selectedFile) {
      setState({
        step: "error",
        progress: 0,
        error: "Please select a file to upload",
      });
      return;
    }

    if (sourceMode === "url" && !youtubeUrl.trim()) {
      setState({ step: "error", progress: 0, error: "Please enter a URL" });
      return;
    }

    try {
      let fileKey: string | undefined;

      if (sourceMode === "upload" && selectedFile) {
        setState({ step: "uploading", progress: 10, error: null });

        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error ?? "Failed to get upload URL");
        }

        const { uploadUrl, fileKey: key } = await presignRes.json();
        fileKey = key;

        setState({ step: "uploading", progress: 30, error: null });

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": selectedFile.type },
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file");
        }

        setState({ step: "uploading", progress: 80, error: null });
      }

      setState({ step: "creating", progress: 90, error: null });

      const episodeRes = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sourceType:
            sourceMode === "upload" ? "UPLOAD" : "YOUTUBE_URL",
          sourceUrl: sourceMode === "url" ? youtubeUrl.trim() : undefined,
          fileKey,
        }),
      });

      if (!episodeRes.ok) {
        const data = await episodeRes.json();
        throw new Error(data.error ?? "Failed to create episode");
      }

      const episode = await episodeRes.json();
      setState({ step: "done", progress: 100, error: null });

      router.push(`/dashboard/episodes/${episode.id}`);
    } catch (error) {
      setState({
        step: "error",
        progress: 0,
        error:
          error instanceof Error ? error.message : "Something went wrong",
      });
    }
  };

  const isSubmitting =
    state.step === "uploading" || state.step === "creating";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Source mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setSourceMode("upload")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            sourceMode === "upload"
              ? "bg-brand text-text-inverse"
              : "bg-bg-surface text-text-secondary hover:bg-bg-elevated"
          }`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setSourceMode("url")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            sourceMode === "url"
              ? "bg-brand text-text-inverse"
              : "bg-bg-surface text-text-secondary hover:bg-bg-elevated"
          }`}
        >
          YouTube URL
        </button>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Episode Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Podcast Episode #42"
          className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
      </div>

      {/* File upload area */}
      {sourceMode === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-border-focus bg-brand-light"
              : selectedFile
                ? "border-success bg-bg-surface"
                : "border-border bg-bg-surface hover:border-border-focus"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {selectedFile ? (
            <div>
              <p className="text-sm font-medium text-text-primary">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB — Click or
                drag to replace
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-text-primary">
                Drop your file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                MP3, WAV, M4A, or MP4 — up to 200MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* YouTube URL input */}
      {sourceMode === "url" && (
        <div>
          <label
            htmlFor="youtube-url"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            YouTube URL
          </label>
          <input
            id="youtube-url"
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>
      )}

      {/* Progress bar */}
      {isSubmitting && (
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary text-center">
            {state.step === "uploading"
              ? "Uploading file..."
              : "Creating episode..."}
          </p>
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? "Processing..."
          : sourceMode === "upload"
            ? "Upload & Transcribe"
            : "Transcribe from URL"}
      </button>
    </form>
  );
}
