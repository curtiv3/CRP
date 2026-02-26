import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-bg-inverse py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-sm font-semibold text-text-inverse">
              ContentRepurpose
            </span>
            <p className="mt-1 text-xs text-text-inverse/60">
              Turn episodes into a week of content.
            </p>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-text-inverse/70 hover:text-text-inverse transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm text-text-inverse/70 hover:text-text-inverse transition-colors"
            >
              Get started
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-text-inverse/70 hover:text-text-inverse transition-colors"
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-text-inverse/10 pt-6 text-center">
          <p className="text-xs text-text-inverse/40">
            &copy; {new Date().getFullYear()} ContentRepurpose. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
