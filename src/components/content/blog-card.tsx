"use client";

import { useState } from "react";

interface BlogCardProps {
  id: string;
  content: string;
  onEdit: (id: string, content: string) => void;
}

export function BlogCard({ id, content, onEdit }: BlogCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const wordCount = editValue.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const title = content.split("\n")[0]?.replace(/^#\s*/, "") ?? "Blog Post";

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
          <span>Blog Draft</span>
          <span>&middot;</span>
          <span>{readingTime} min read</span>
          <span>&middot;</span>
          <span>{wordCount} words</span>
        </div>
        <h3 className="text-lg font-semibold text-text-primary leading-tight">
          {title}
        </h3>
      </div>

      <div className="px-6 pb-4">
        {editing ? (
          <div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary resize-none focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus font-mono"
              rows={16}
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
            <div className="max-h-96 overflow-y-auto">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {content.split("\n").slice(1).join("\n").trim()}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
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
