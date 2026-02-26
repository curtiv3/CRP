"use client";

import { useState } from "react";

interface TikTokCardProps {
  id: string;
  content: string;
  order: number;
  onEdit: (id: string, content: string) => void;
}

export function TikTokCard({ id, content, order, onEdit }: TikTokCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-secondary">
          Clip Suggestion #{order}
        </span>
        <span className="text-xs text-platform-youtube font-mono">
          Short / TikTok
        </span>
      </div>

      {editing ? (
        <div>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary resize-none focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            rows={4}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setEditValue(content);
                setEditing(false);
              }}
              className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-text-inverse hover:bg-brand-hover transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Edit
            </button>
            <CopyButton text={content} />
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-md bg-bg-elevated px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
