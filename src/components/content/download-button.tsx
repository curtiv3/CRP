"use client";

import { useState } from "react";

interface DownloadButtonProps {
  episodeId: string;
  episodeTitle: string;
}

export function DownloadButton({ episodeId, episodeTitle }: DownloadButtonProps) {
  const [open, setOpen] = useState(false);

  const handleDownload = (format: "md" | "txt") => {
    const filename = `${episodeTitle.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-")}.${format}`;
    const link = document.createElement("a");
    link.href = `/api/episodes/${episodeId}/export?format=${format}`;
    link.download = filename;
    link.click();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        Download
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-border bg-bg-surface shadow-md py-1 min-w-[140px]">
            <button
              onClick={() => handleDownload("md")}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated transition-colors"
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => handleDownload("txt")}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated transition-colors"
            >
              Plain text (.txt)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
