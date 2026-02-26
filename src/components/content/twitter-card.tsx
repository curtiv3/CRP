"use client";

import { useState } from "react";
import { ContentActions, type ContentStatus } from "./content-actions";

interface TwitterCardProps {
  id: string;
  content: string;
  status: ContentStatus;
  type: "THREAD" | "POST";
  order: number;
  threadLength?: number;
  onEdit: (id: string, content: string) => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
}

export function TwitterCard({
  id,
  content,
  status,
  type,
  order,
  threadLength,
  onEdit,
  onStatusChange,
}: TwitterCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const charCount = editValue.length;
  const isOverLimit = charCount > 280;

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-bg-elevated" />
        <div>
          <div className="text-sm font-medium text-text-primary">Your Name</div>
          <div className="text-xs text-text-muted">@yourhandle</div>
        </div>
        {type === "THREAD" && threadLength && (
          <span className="ml-auto text-xs font-mono text-platform-twitter">
            {order}/{threadLength}
          </span>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary resize-none focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            rows={4}
          />
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`text-xs font-mono ${isOverLimit ? "text-danger" : "text-text-muted"}`}
            >
              {charCount}/280
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
                disabled={isOverLimit}
                className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-text-inverse hover:bg-brand-hover disabled:opacity-50 transition-colors"
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
            <span
              className={`text-xs font-mono ${content.length > 280 ? "text-danger" : "text-text-muted"}`}
            >
              {content.length}/280
            </span>
          </div>
          <div className="mt-2">
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
  );
}
