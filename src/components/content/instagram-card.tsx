"use client";

import { useState } from "react";
import { ContentActions, type ContentStatus } from "./content-actions";

interface InstagramCardProps {
  id: string;
  content: string;
  status: ContentStatus;
  order: number;
  onEdit: (id: string, content: string) => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
}

export function InstagramCard({ id, content, status, order, onEdit, onStatusChange }: InstagramCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  // Split content into caption text and hashtags
  const hashtagMatch = content.match(/((?:#\w+\s*)+)$/);
  const captionText = hashtagMatch
    ? content.slice(0, content.length - hashtagMatch[0].length).trim()
    : content;
  const hashtags = hashtagMatch ? hashtagMatch[0].trim() : null;

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-bg-elevated" />
        <div className="text-sm font-semibold text-text-primary">yourhandle</div>
        <span className="ml-auto text-xs font-mono text-text-muted">
          Caption #{order}
        </span>
      </div>

      <div className="h-10 bg-bg-elevated flex items-center justify-center border-y border-border">
        <span className="text-xs text-text-muted">Audiogram / Reel</span>
      </div>

      <div className="px-4 py-3">
        {editing ? (
          <div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary resize-none focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              rows={6}
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
              {captionText}
            </p>
            {hashtags && (
              <p className="mt-2 text-sm text-platform-instagram leading-relaxed">
                {hashtags}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted">
                {wordCount} words
              </span>
              <ContentActions
                id={id}
                content={content}
                status={status}
                editing={editing}
                onEdit={() => setEditing(true)}
                onStatusChange={onStatusChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
