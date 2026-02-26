"use client";

import { useState } from "react";
import { TwitterCard } from "./twitter-card";
import { LinkedInCard } from "./linkedin-card";
import { InstagramCard } from "./instagram-card";
import { NewsletterCard } from "./newsletter-card";
import { BlogCard } from "./blog-card";
import { TikTokCard } from "./tiktok-card";

interface ContentPiece {
  id: string;
  platform: string;
  type: string;
  content: string;
  order: number;
}

interface ContentDisplayProps {
  pieces: ContentPiece[];
}

const PLATFORM_CONFIG: Record<
  string,
  { label: string; colorClass: string }
> = {
  TWITTER: { label: "Twitter / X", colorClass: "bg-platform-twitter" },
  LINKEDIN: { label: "LinkedIn", colorClass: "bg-platform-linkedin" },
  INSTAGRAM: { label: "Instagram", colorClass: "bg-platform-instagram" },
  NEWSLETTER: { label: "Newsletter", colorClass: "bg-platform-newsletter" },
  BLOG: { label: "Blog", colorClass: "bg-platform-blog" },
  TIKTOK: { label: "TikTok / Shorts", colorClass: "bg-platform-youtube" },
};

const PLATFORM_ORDER = ["TWITTER", "LINKEDIN", "INSTAGRAM", "NEWSLETTER", "BLOG", "TIKTOK"];

export function ContentDisplay({ pieces: initialPieces }: ContentDisplayProps) {
  const [pieces, setPieces] = useState(initialPieces);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const grouped = new Map<string, ContentPiece[]>();
  for (const piece of pieces) {
    const existing = grouped.get(piece.platform) ?? [];
    existing.push(piece);
    grouped.set(piece.platform, existing);
  }

  const platforms = PLATFORM_ORDER.filter((p) => grouped.has(p));

  const visiblePlatforms = activePlatform
    ? platforms.filter((p) => p === activePlatform)
    : platforms;

  const handleEdit = async (id: string, newContent: string) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content: newContent } : p)),
    );

    try {
      await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
    } catch {
      // Revert on failure
      setPieces(initialPieces);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActivePlatform(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activePlatform === null
              ? "bg-brand text-text-inverse"
              : "bg-bg-elevated text-text-secondary hover:text-text-primary"
          }`}
        >
          All ({pieces.length})
        </button>
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const count = grouped.get(platform)?.length ?? 0;
          return (
            <button
              key={platform}
              onClick={() =>
                setActivePlatform(activePlatform === platform ? null : platform)
              }
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activePlatform === platform
                  ? "bg-brand text-text-inverse"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${config?.colorClass ?? "bg-bg-elevated"} mr-1.5`}
              />
              {config?.label ?? platform} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-8">
        {visiblePlatforms.map((platform) => {
          const platformPieces = grouped.get(platform) ?? [];
          const config = PLATFORM_CONFIG[platform];

          const threads = platformPieces.filter((p) => p.type === "THREAD");
          const posts = platformPieces.filter((p) => p.type === "POST");
          const other = platformPieces.filter(
            (p) => p.type !== "THREAD" && p.type !== "POST",
          );

          return (
            <section key={platform}>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${config?.colorClass ?? "bg-bg-elevated"}`}
                />
                <h3 className="text-base font-semibold text-text-primary">
                  {config?.label ?? platform}
                </h3>
                <span className="text-xs text-text-muted font-mono">
                  {platformPieces.length} piece{platformPieces.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {platform === "TWITTER" && (
                  <>
                    {threads.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
                          Thread
                        </div>
                        <div className="space-y-2 pl-3 border-l-2 border-platform-twitter/30">
                          {threads.map((piece) => (
                            <TwitterCard
                              key={piece.id}
                              id={piece.id}
                              content={piece.content}
                              type="THREAD"
                              order={piece.order}
                              threadLength={threads.length}
                              onEdit={handleEdit}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {posts.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
                          Standalone Tweets
                        </div>
                        <div className="space-y-2">
                          {posts.map((piece) => (
                            <TwitterCard
                              key={piece.id}
                              id={piece.id}
                              content={piece.content}
                              type="POST"
                              order={piece.order}
                              onEdit={handleEdit}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {platform === "LINKEDIN" &&
                  platformPieces.map((piece) => (
                    <LinkedInCard
                      key={piece.id}
                      id={piece.id}
                      content={piece.content}
                      order={piece.order}
                      onEdit={handleEdit}
                    />
                  ))}

                {platform === "INSTAGRAM" &&
                  platformPieces.map((piece) => (
                    <InstagramCard
                      key={piece.id}
                      id={piece.id}
                      content={piece.content}
                      order={piece.order}
                      onEdit={handleEdit}
                    />
                  ))}

                {platform === "NEWSLETTER" &&
                  platformPieces.map((piece) => (
                    <NewsletterCard
                      key={piece.id}
                      id={piece.id}
                      content={piece.content}
                      onEdit={handleEdit}
                    />
                  ))}

                {platform === "BLOG" &&
                  platformPieces.map((piece) => (
                    <BlogCard
                      key={piece.id}
                      id={piece.id}
                      content={piece.content}
                      onEdit={handleEdit}
                    />
                  ))}

                {platform === "TIKTOK" &&
                  platformPieces.map((piece) => (
                    <TikTokCard
                      key={piece.id}
                      id={piece.id}
                      content={piece.content}
                      order={piece.order}
                      onEdit={handleEdit}
                    />
                  ))}

                {/* Fallback for any unmatched types on non-twitter platforms */}
                {platform !== "TWITTER" &&
                  platform !== "LINKEDIN" &&
                  platform !== "INSTAGRAM" &&
                  platform !== "NEWSLETTER" &&
                  platform !== "BLOG" &&
                  platform !== "TIKTOK" &&
                  other.map((piece) => (
                    <GenericCard
                      key={piece.id}
                      id={piece.id}
                      content={piece.content}
                      onEdit={handleEdit}
                    />
                  ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function GenericCard({
  id,
  content,
  onEdit,
}: {
  id: string;
  content: string;
  onEdit: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleSave = () => {
    onEdit(id, editValue);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
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
          </div>
        </div>
      )}
    </div>
  );
}
