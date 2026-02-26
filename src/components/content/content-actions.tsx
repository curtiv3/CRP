"use client";

import { useState } from "react";

export type ContentStatus = "GENERATED" | "EDITED" | "COPIED" | "PUBLISHED";

const STATUS_CONFIG: Record<ContentStatus, { label: string; className: string }> = {
  GENERATED: { label: "Generated", className: "text-text-muted" },
  EDITED: { label: "Edited", className: "text-warning" },
  COPIED: { label: "Copied", className: "text-info" },
  PUBLISHED: { label: "Published", className: "text-success" },
};

interface ContentActionsProps {
  id: string;
  content: string;
  status: ContentStatus;
  onEdit: () => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
  editing: boolean;
}

export function ContentActions({
  id,
  content,
  status,
  onEdit,
  onStatusChange,
  editing,
}: ContentActionsProps) {
  const [copied, setCopied] = useState(false);
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.GENERATED;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    if (status === "GENERATED") {
      onStatusChange(id, "COPIED");
    }
    // Track copy for analytics
    fetch(`/api/content/${id}/copy`, { method: "POST" }).catch(() => {});
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublished = () => {
    const next = status === "PUBLISHED" ? "EDITED" : "PUBLISHED";
    onStatusChange(id, next);
  };

  if (editing) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePublished}
        className={`rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
          status === "PUBLISHED"
            ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
            : "border-border bg-bg-elevated text-text-muted hover:text-text-secondary"
        }`}
      >
        {status === "PUBLISHED" ? "Published" : "Mark published"}
      </button>
      <span className={`text-xs ${statusConfig.className}`}>
        {status !== "PUBLISHED" && statusConfig.label}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onEdit}
          className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleCopy}
          className="rounded-md bg-bg-elevated px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
