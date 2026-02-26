"use client";

import { useState } from "react";

interface InstagramCardProps {
  id: string;
  content: string;
  order: number;
  onEdit: (id: string, content: string) => void;
}

export function InstagramCard({ id, content, order, onEdit }: InstagramCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-bg-elevated" />
        <div className="text-sm font-semibold text-text-primary">yourhandle</div>
        <span className="ml-auto text-xs font-mono text-text-muted">
          Caption #{order}
        </span>
      </div>

      <div className="aspect-square bg-bg-elevated flex items-center justify-center">
        <span className="text-sm text-text-muted">Audiogram / Reel</span>
      </div>

      <div className="px-4 py-3">
        {editing ? (
          <div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary resize-none focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              rows={5}
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
