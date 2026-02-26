"use client";

import { useState } from "react";

interface NewsletterCardProps {
  id: string;
  content: string;
  onEdit: (id: string, content: string) => void;
}

export function NewsletterCard({ id, content, onEdit }: NewsletterCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const wordCount = editValue.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      <div className="bg-bg-elevated px-4 py-3 border-b border-border">
        <div className="text-xs text-text-muted">Newsletter Draft</div>
        <div className="mt-1 text-sm font-medium text-text-primary">
          Subject: New Episode Recap
        </div>
      </div>

      <div className="px-4 py-4">
        {editing ? (
          <div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary resize-none focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              rows={12}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-text-muted font-mono">
                {wordCount} words &middot; {readingTime} min read
              </span>
              <div className="flex gap-2">
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
          </div>
        ) : (
          <div>
            <div className="prose-sm max-h-96 overflow-y-auto">
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-muted font-mono">
                {content.split(/\s+/).filter(Boolean).length} words &middot;{" "}
                {Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 200))} min read
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <CopyButton text={content} />
              </div>
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
