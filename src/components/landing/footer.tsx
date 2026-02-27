import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-bg-inverse">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <span className="text-base font-semibold text-text-inverse">
              ContentRepurpose
            </span>
            <p className="mt-2 text-sm text-text-inverse/60 max-w-xs">
              Turn every episode into a week of content. Built for solo
              creators who don&apos;t have time to repurpose manually.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-xs font-semibold text-text-inverse/40 uppercase tracking-wide mb-3">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/#pricing"
                    className="text-sm text-text-inverse/70 hover:text-text-inverse transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-text-inverse/70 hover:text-text-inverse transition-colors"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-sm text-text-inverse/70 hover:text-text-inverse transition-colors"
                  >
                    Get started
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-text-inverse/10 pt-6 text-center text-xs text-text-inverse/40">
          &copy; {new Date().getFullYear()} ContentRepurpose. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
