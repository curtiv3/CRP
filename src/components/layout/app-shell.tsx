"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Episodes" },
    { href: "/dashboard/episodes/new", label: "Upload" },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="border-b border-border bg-bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="text-lg font-semibold text-text-primary"
              >
                ContentRepurpose
              </Link>
              <div className="flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-light text-brand"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">
                {user.name ?? user.email}
              </span>
              <div className="h-8 w-8 rounded-full bg-bg-elevated flex items-center justify-center text-sm font-medium text-text-secondary">
                {(user.name ?? user.email ?? "U")[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
