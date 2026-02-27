"use client";

import { useState } from "react";

interface StyleProfileData {
  tone: string;
  vocabulary: Record<string, unknown>;
  hookPatterns: string[];
  platformPreferences: Record<string, unknown>;
  sampleCount: number;
  updatedAt: string;
}

interface StyleProfileEditorProps {
  profile: StyleProfileData | null;
}

const TONE_OPTIONS = [
  { value: "casual", label: "Casual", description: "Conversational, relaxed, friendly" },
  { value: "professional", label: "Professional", description: "Polished, authoritative, clear" },
  { value: "mixed", label: "Mixed", description: "Adapts per platform — casual on Twitter, professional on LinkedIn" },
];

const EMOJI_OPTIONS = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy", label: "Heavy" },
];

const HASHTAG_OPTIONS = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "platform_specific", label: "Platform-specific" },
];

export function StyleProfileEditor({ profile }: StyleProfileEditorProps) {
  const vocabulary = (profile?.vocabulary ?? {}) as Record<string, unknown>;
  const platformPrefs = (profile?.platformPreferences ?? {}) as Record<string, unknown>;

  const [tone, setTone] = useState(profile?.tone ?? "mixed");
  const [emojiUsage, setEmojiUsage] = useState(
    (vocabulary.emojiUsage as string) ?? "none",
  );
  const [hashtagUsage, setHashtagUsage] = useState(
    (vocabulary.hashtagUsage as string) ?? "none",
  );
  const [hookPatterns, setHookPatterns] = useState(
    (profile?.hookPatterns ?? []).join(", "),
  );
  const [preferences, setPreferences] = useState(
    ((vocabulary.preferences as string[]) ?? []).join(", "),
  );
  const [avoidances, setAvoidances] = useState(
    ((vocabulary.avoidances as string[]) ?? []).join(", "),
  );
  const [signaturePatterns, setSignaturePatterns] = useState(
    ((platformPrefs.signaturePatterns as string[]) ?? []).join(", "),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const splitAndTrim = (val: string) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      await fetch("/api/style-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone,
          vocabulary: {
            preferences: splitAndTrim(preferences),
            avoidances: splitAndTrim(avoidances),
            emojiUsage,
            hashtagUsage,
          },
          hookPatterns: splitAndTrim(hookPatterns),
          platformPreferences: {
            signaturePatterns: splitAndTrim(signaturePatterns),
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {profile && (
        <div className="rounded-lg border border-border bg-bg-surface px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Based on {profile.sampleCount} episode{profile.sampleCount !== 1 ? "s" : ""}
            {" "}&middot; Last updated{" "}
            {new Date(profile.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-xs font-mono text-success">Active</span>
        </div>
      )}

      {/* Tone */}
      <section className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Tone</h2>
        <div className="space-y-2">
          {TONE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                tone === option.value
                  ? "border-brand bg-brand-light/30"
                  : "border-border hover:bg-bg-elevated"
              }`}
            >
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={tone === option.value}
                onChange={(e) => setTone(e.target.value)}
                className="mt-0.5 accent-brand"
              />
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {option.label}
                </div>
                <div className="text-xs text-text-secondary">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Emoji & Hashtag */}
      <section className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Formatting Preferences
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Emoji usage
            </label>
            <select
              value={emojiUsage}
              onChange={(e) => setEmojiUsage(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            >
              {EMOJI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Hashtag usage
            </label>
            <select
              value={hashtagUsage}
              onChange={(e) => setHashtagUsage(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            >
              {HASHTAG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Vocabulary */}
      <section className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Vocabulary
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Words and phrases to use (comma-separated)
            </label>
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., game-changer, here's the thing, let me tell you"
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Words and phrases to avoid (comma-separated)
            </label>
            <input
              type="text"
              value={avoidances}
              onChange={(e) => setAvoidances(e.target.value)}
              placeholder="e.g., synergy, leverage, utilize"
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            />
          </div>
        </div>
      </section>

      {/* Hooks & Patterns */}
      <section className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Writing Patterns
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Hook styles you prefer (comma-separated)
            </label>
            <input
              type="text"
              value={hookPatterns}
              onChange={(e) => setHookPatterns(e.target.value)}
              placeholder="e.g., question, bold_claim, story_opening, contrarian"
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            />
            <p className="mt-1 text-xs text-text-muted">
              How your posts typically open: question, bold_claim, story_opening,
              statistic, contrarian, personal_anecdote
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Signature patterns or sign-offs (comma-separated)
            </label>
            <input
              type="text"
              value={signaturePatterns}
              onChange={(e) => setSignaturePatterns(e.target.value)}
              placeholder='e.g., "What do you think?", always ends with a question'
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        {saved && (
          <span className="text-sm text-success">Saved</span>
        )}
      </div>
    </div>
  );
}
