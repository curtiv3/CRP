"use client";

import { useState } from "react";

interface LinkedInCardProps {
  id: string;
  content: string;
  order: number;
  onEdit: (id: string, content: string) => void;
}

export function LinkedInCard({ id, content, order, onEdit }: LinkedInCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const wordCount = editValue.split(/\s+/).filter(Boolean).length;

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-bg-elevated" />
        <div>
          <div className="text-sm font-semibold text-text-primary">Your Name</div>
          <div className="text-xs text-text-muted">Creator &middot; Podcaster</div>
          <div className="text-xs text-text-muted">Just now</div>
        </div>
        {order > 0 && (
          <span className="ml-auto text-xs font-mono text-text-muted">
            Post #{order}
          </span>
        )}
      </div>

      <div className="px-4 pb-3">
        {editing ? (
          <div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary resize-none focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              rows={8}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-text-muted font-mono">
                {wordCount} words
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
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-muted font-mono">
                {content.split(/\s+/).filter(Boolean).length} words
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

      <div className="border-t border-border px-4 py-2 flex items-center gap-6 text-xs text-text-muted">
        <span>Like</span>
        <span>Comment</span>
        <span>Repost</span>
        <span>Send</span>
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
