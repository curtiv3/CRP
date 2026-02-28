"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface SettingsFormProps {
  name: string;
  email: string;
  tier: string;
  hasPassword: boolean;
}

export function SettingsForm({ name: initialName, email, tier, hasPassword }: SettingsFormProps) {
  return (
    <div className="space-y-8">
      <ProfileSection initialName={initialName} email={email} tier={tier} />
      {hasPassword && <PasswordSection />}
      <DeleteSection />
    </div>
  );
}

function ProfileSection({
  initialName,
  email,
  tier,
}: {
  initialName: string;
  email: string;
  tier: string;
}) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to update");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-6">
      <h2 className="text-base font-semibold text-text-primary mb-4">Profile</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className="w-full max-w-sm rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-secondary"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>
        <div>
          <p className="text-sm text-text-secondary">
            Plan: <span className="font-medium text-text-primary">{tier}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || name === initialName}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          {saved && <span className="text-sm text-success">Saved</span>}
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      </form>
    </div>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to change password");
      }

      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-6">
      <h2 className="text-base font-semibold text-text-primary mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-text-primary mb-1.5">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full max-w-sm rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-text-primary mb-1.5">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full max-w-sm rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
          <p className="mt-1 text-xs text-text-muted">At least 8 characters, with uppercase, lowercase, and a number</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full max-w-sm rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
          {saved && <span className="text-sm text-success">Password updated</span>}
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      </form>
    </div>
  );
}

function DeleteSection() {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete account");
      }

      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-danger/20 bg-bg-surface p-6">
      <h2 className="text-base font-semibold text-danger mb-2">Delete Account</h2>
      <p className="text-sm text-text-secondary mb-4">
        This will permanently delete your account, all episodes, generated content, and style profiles. This action cannot be undone.
      </p>
      <form onSubmit={handleDelete} className="space-y-4">
        <div>
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-text-primary mb-1.5">
            Type DELETE to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="w-full max-w-sm rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || confirmation !== "DELETE"}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete Account"}
          </button>
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
      </form>
    </div>
  );
}
